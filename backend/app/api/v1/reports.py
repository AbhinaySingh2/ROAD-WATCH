from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from app.core.limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import os
import aiofiles
from datetime import datetime
import secrets
from PIL import Image

from app.core.database import get_db
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportUpdate, ReportResponse
from app.services.ai_analysis import analyze_image
from app.services.geocoding import reverse_geocode
from app.services.routing_engine import determine_authority

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/submit", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def submit_report(
    request: Request,
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    image: UploadFile = File(None),
    db: AsyncSession = Depends(get_db)
):
    if latitude < -90 or latitude > 90 or longitude < -180 or longitude > 180:
        raise HTTPException(status_code=400, detail="Invalid latitude/longitude")

    image_path = None
    if image:
        content_type = (image.content_type or "").lower()
        allowed = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
        if content_type not in allowed:
            raise HTTPException(status_code=400, detail="Unsupported image type. Use JPEG/PNG/WebP.")

        # Save image locally (streamed)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        token = secrets.token_hex(6)
        image_filename = f"report_{timestamp}_{token}.{allowed[content_type]}"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        
        async with aiofiles.open(image_path, 'wb') as out_file:
            total_size = 0
            while True:
                chunk = await image.read(1024 * 1024)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > 8 * 1024 * 1024:
                    await out_file.close()
                    try:
                        os.remove(image_path)
                    except OSError:
                        pass
                    raise HTTPException(status_code=400, detail="Image too large. Max size is 8 MB.")
                await out_file.write(chunk)

        # Verify the file is an actual image (reject spoofed content-types/files)
        try:
            with Image.open(image_path) as img:
                img.verify()
        except Exception:
            try:
                os.remove(image_path)
            except OSError:
                pass
            raise HTTPException(status_code=400, detail="Invalid image file.")

        # Check for duplicate image uploads by computing MD5 file hash to prevent spam
        import hashlib
        try:
            with open(image_path, "rb") as f:
                new_hash = hashlib.md5(f.read()).hexdigest()
            
            duplicate_found = False
            existing_url = None
            for filename in os.listdir(UPLOAD_DIR):
                existing_path = os.path.join(UPLOAD_DIR, filename)
                if existing_path == image_path:
                    continue
                if os.path.isfile(existing_path):
                    try:
                        with open(existing_path, "rb") as f_ext:
                            if hashlib.md5(f_ext.read()).hexdigest() == new_hash:
                                duplicate_found = True
                                existing_url = existing_path
                                break
                    except Exception:
                        continue
            
            if duplicate_found and existing_url:
                # Find the existing report associated with this image
                result = await db.execute(select(Report).where(Report.image_url == existing_url))
                existing_report = result.scalar_one_or_none()
                if existing_report:
                    # Automatically upvote the existing report to boost repair priority
                    existing_report.upvotes = (existing_report.upvotes or 0) + 1
                    if existing_report.upvotes > 0 and existing_report.upvotes % 10 == 0:
                        current_score = existing_report.impact_score or 0
                        increment = max(1, int(current_score * 0.05))
                        existing_report.impact_score = min(100, current_score + increment)
                    
                    await db.commit()
                    
                    # Clean up the newly uploaded duplicate file
                    try:
                        os.remove(image_path)
                    except OSError:
                        pass
                    
                    raise HTTPException(
                        status_code=400,
                        detail="This hazard has already been reported! We have automatically upvoted the existing report to boost its repair priority, but duplicate points are not awarded to prevent abuse."
                    )
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error checking duplicate image upload: {e}")

    # 1. AI Analysis
    ai_result = None
    if image_path:
        ai_result = await analyze_image(image_path)
        if ai_result and ai_result.impact_score == 0:
            try:
                os.remove(image_path)
            except OSError:
                pass
            raise HTTPException(
                status_code=400,
                detail="Invalid report. Gemini detected no road or infrastructure damage in this photo."
            )
    
    # 2. Geocoding
    address, road_name = await reverse_geocode(latitude, longitude)
    
    # 3. Routing Engine
    authority = determine_authority(road_name)
    
    # 4. Create Database Entry
    report_data = {
        "latitude": latitude,
        "longitude": longitude,
        "image_url": image_path,
        "address": address,
        "road_name": road_name,
        "assigned_authority": authority,
        "citizen_description": description,
    }
    
    if ai_result:
        report_data.update({
            "severity": ai_result.severity,
            "infra_type": ai_result.infra_type,
            "ai_confidence": ai_result.ai_confidence,
            "ai_description": ai_result.ai_description,
            "impact_score": ai_result.impact_score,
        })
        
    db_report = Report(**report_data)
    db.add(db_report)
    await db.commit()
    await db.refresh(db_report)
    
    return db_report

@router.get("", response_model=List[ReportResponse])
async def get_reports(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).offset(skip).limit(limit))
    reports = result.scalars().all()
    return reports

@router.patch("/{id}", response_model=ReportResponse)
async def update_report(
    id: int, 
    report_update: ReportUpdate, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Report).where(Report.id == id))
    db_report = result.scalar_one_or_none()
    
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
        
    update_data = report_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_report, key, value)
        
    await db.commit()
    await db.refresh(db_report)
    return db_report

@router.post("/{id}/upvote", response_model=ReportResponse)
@limiter.limit("60/minute")
async def upvote_report(request: Request, id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == id))
    db_report = result.scalar_one_or_none()
    
    if db_report is None:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    db_report.upvotes = (db_report.upvotes or 0) + 1
    
    # Every 10 upvotes organically increases the impact_score of the issue by 5%
    if db_report.upvotes > 0 and db_report.upvotes % 10 == 0:
        current_score = db_report.impact_score or 0
        increment = max(1, int(current_score * 0.05))
        db_report.impact_score = min(100, current_score + increment)
        
    await db.commit()
    await db.refresh(db_report)
    return db_report
