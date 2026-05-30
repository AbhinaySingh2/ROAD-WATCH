import os, enum, logging, asyncio, json, uuid, io, hashlib # <-- NEW: hashlib added
from datetime import datetime
from typing import List, Optional, Tuple
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text, func, select, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from google import genai
from PIL import Image
from geopy.geocoders import Nominatim
from supabase import create_client, Client

class Settings(BaseSettings):
    PROJECT_NAME: str = "RoadWatch API"; VERSION: str = "1.0.0"; API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite+aiosqlite:///./roadwatch.db"; GEMINI_API_KEY: Optional[str] = None
    CORS_ALLOW_ORIGINS: Optional[str] = None
    SECRET_KEY: Optional[str] = None
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
limiter = Limiter(key_func=get_remote_address)

if settings.SUPABASE_URL and settings.SUPABASE_KEY:
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
else:
    supabase = None
    logging.warning("Supabase credentials missing! Uploads will fail.")

engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True, pool_size=10, max_overflow=20, pool_recycle=1800)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session: yield session

class ReportStatus(str, enum.Enum): PENDING = "PENDING"; VERIFIED = "VERIFIED"; REJECTED = "REJECTED"; IN_PROGRESS = "IN_PROGRESS"; RESOLVED = "RESOLVED"
class SeverityLevel(str, enum.Enum): LOW = "LOW"; MEDIUM = "MEDIUM"; HIGH = "HIGH"; CRITICAL = "CRITICAL"
class InfrastructureType(str, enum.Enum): POTHOLE = "POTHOLE"; CRACK = "CRACK"; UNPAVED = "UNPAVED"; WATERLOGGING = "WATERLOGGING"; OTHER = "OTHER"
class Authority(str, enum.Enum): NHAI = "NHAI"; STATE_HIGHWAY = "STATE_HIGHWAY"; MUNICIPAL = "MUNICIPAL"; UNKNOWN = "UNKNOWN"

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True); latitude = Column(Float, nullable=False); longitude = Column(Float, nullable=False); image_url = Column(String, nullable=True)
    # --- NEW: Added image_hash column ---
    image_hash = Column(String, index=True, nullable=True)
    
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.LOW); infra_type = Column(Enum(InfrastructureType), default=InfrastructureType.OTHER); ai_confidence = Column(Float, default=0.0); ai_description = Column(Text, nullable=True)
    impact_score = Column(Integer, default=0); upvotes = Column(Integer, default=0, nullable=False); citizen_description = Column(Text, nullable=True); address = Column(Text, nullable=True)
    road_name = Column(String, nullable=True); assigned_authority = Column(Enum(Authority), default=Authority.UNKNOWN, index=True); status = Column(Enum(ReportStatus), default=ReportStatus.PENDING, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True); updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ReportUpdate(BaseModel): status: Optional[ReportStatus] = None; severity: Optional[SeverityLevel] = None

class AISettingsUpdate(BaseModel): model: Optional[str] = None; temperature: Optional[float] = None; min_confidence: Optional[float] = None; scan_density: Optional[str] = None

ai_settings = {
    "model": "gemini-2.5-flash",
    "temperature": 0.2,
    "min_confidence": 75.0,
    "scan_density": "High Definition"
}

class ReportResponse(BaseModel):
    id: int; latitude: float; longitude: float; image_url: Optional[str] = None; severity: SeverityLevel; infra_type: InfrastructureType; ai_confidence: float; ai_description: Optional[str] = None; impact_score: Optional[int] = None; upvotes: int = 0; citizen_description: Optional[str] = None; address: Optional[str] = None; road_name: Optional[str] = None; assigned_authority: Authority; status: ReportStatus; created_at: datetime; updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

logger = logging.getLogger(__name__)
geolocator = Nominatim(user_agent="roadwatch_api")

class AIAnalysisResult(BaseModel):
    is_road_damage: bool = Field(description="Damage status")
    severity: str = Field(description="LOW/MEDIUM/HIGH/CRITICAL")
    infra_type: str = Field(description="POTHOLE/CRACK/UNPAVED/WATERLOGGING/OTHER")
    ai_confidence: float = Field(description="0.0-1.0")
    ai_description: str = Field(description="Damage description")
    impact_score: int = Field(description="1-100")

async def analyze_image(img: Image.Image) -> AIAnalysisResult:
    if not settings.GEMINI_API_KEY: return get_mock_analysis()
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = "Determine if this image shows a real road/street/infrastructure with damage. Set is_road_damage. Classify type (POTHOLE, CRACK, UNPAVED, WATERLOGGING, OTHER), severity (LOW, MEDIUM, HIGH, CRITICAL), and assign impact score (1-100)."
        response = await asyncio.wait_for(asyncio.to_thread(lambda: client.models.generate_content(
            model=ai_settings.get("model", "gemini-2.5-flash"), contents=[img, prompt],
            config={
                "response_mime_type": "application/json",
                "response_schema": AIAnalysisResult,
                "temperature": ai_settings.get("temperature", 0.2)
            }
        )), timeout=5.0)
        if response.text: return AIAnalysisResult(**json.loads(response.text))
    except asyncio.TimeoutError: logger.error("Gemini timed out, using mock fallback.")
    except Exception as e: logger.error(f"AI failed: {e}")
    return get_mock_analysis()

def get_mock_analysis() -> AIAnalysisResult:
    return AIAnalysisResult(is_road_damage=True, severity="MEDIUM", infra_type="POTHOLE", ai_confidence=0.85, ai_description="Mock pothole detected.", impact_score=65)

async def reverse_geocode(lat: float, lon: float) -> Tuple[Optional[str], Optional[str]]:
    try:
        loc = await asyncio.to_thread(geolocator.reverse, (lat, lon), exactly_one=True, timeout=2.0)
        if loc: return loc.address, loc.raw.get('address', {}).get('road') or loc.raw.get('address', {}).get('highway')
    except Exception as e: logger.error(f"Geocoding error: {e}")
    return None, None

def determine_authority(road_name: str) -> str:
    n = (road_name or "").upper()
    return "NHAI" if "NH" in n or "NATIONAL HIGHWAY" in n else "STATE_HIGHWAY" if "SH" in n or "STATE HIGHWAY" in n else "MUNICIPAL"

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)
@app.on_event("startup")
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in settings.CORS_ALLOW_ORIGINS.split(",") if o.strip()] if settings.CORS_ALLOW_ORIGINS else ["*" ]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.get("/")
def read_root(): return {"message": "Welcome to RoadWatch API"}

@app.get(f"{settings.API_V1_STR}/settings")
async def get_ai_settings(): return ai_settings

@app.post(f"{settings.API_V1_STR}/settings")
async def update_ai_settings(settings_update: AISettingsUpdate):
    ai_settings.update(settings_update.model_dump(exclude_unset=True))
    return ai_settings

@app.post(f"{settings.API_V1_STR}/issues/submit", response_model=ReportResponse, status_code=201)
@limiter.limit("5/minute")
async def submit_report(
    request: Request, latitude: float = Form(...), longitude: float = Form(...),
    description: str = Form(None), image: UploadFile = File(None), db: AsyncSession = Depends(get_db)
):
    public_image_url = None
    file_name = None
    img_obj = None
    file_hash = None # <-- NEW: Initialized just in case there's no image

    if image:
        ext = image.filename.split('.')[-1].lower() if '.' in image.filename else ""
        if ext not in ["jpg", "jpeg", "png", "webp"]: raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, JPEG, PNG, and WEBP allowed.")
        
        try:
            img_obj = Image.open(image.file)
            if img_obj.width > 1280: img_obj = img_obj.resize((1280, int(1280 * (img_obj.height / img_obj.width))), Image.LANCZOS)
            
            img_byte_arr = io.BytesIO()
            img_obj.convert("RGB").save(img_byte_arr, format="JPEG", quality=75, optimize=True)
            img_bytes = img_byte_arr.getvalue()

            # --- NEW: Generate Hash and Check for Duplicates ---
            file_hash = hashlib.md5(img_bytes).hexdigest()
            existing_report = (await db.execute(select(Report).where(Report.image_hash == file_hash))).scalar_one_or_none()
            if existing_report:
                raise HTTPException(status_code=409, detail="Duplicate rejected: This exact image has already been reported.")
            # ---------------------------------------------------

            if not supabase: raise Exception("Supabase client not initialized")
            
            file_name = f"report_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}.jpg"
            
            supabase.storage.from_("uploads").upload(
                path=file_name,
                file=img_bytes,
                file_options={"content-type": "image/jpeg"}
            )
            public_image_url = supabase.storage.from_("uploads").get_public_url(file_name)

        except HTTPException:
            raise # Re-raise the duplicate error without catching it
        except Exception as e: 
            raise HTTPException(status_code=400, detail=f"Failed to process or upload image: {str(e)}")

    ai_res = await analyze_image(img_obj) if img_obj else None
    kws = ["map", "selfie", "spam", "dog", "cat", "flower", "logo"]
    if ai_res and any(k in (s or "").lower() for k in kws for s in [description, getattr(image, 'filename', None)]):
        ai_res.is_road_damage = False
        ai_res.ai_description = "The provided image does not contain any road, street, or civic infrastructure."

    address, road_name = await reverse_geocode(latitude, longitude)
    authority = determine_authority(road_name)

    def fail(msg: str):
        if file_name and supabase:
            try: supabase.storage.from_("uploads").remove([file_name])
            except Exception: pass
        raise HTTPException(status_code=400, detail=msg)
        
    if ai_res and not ai_res.is_road_damage: fail(f"AI Validation Failed: {ai_res.ai_description}")
    if ai_res and ai_res.ai_confidence < (ai_settings.get("min_confidence", 75.0) / 100.0):
        fail(f"AI Triage Failed: Confidence level ({int(ai_res.ai_confidence * 100)}%) is below the required threshold ({int(ai_settings['min_confidence'])}%).")

    # --- NEW: Added image_hash to the database insertion ---
    data = {"latitude": latitude, "longitude": longitude, "image_url": public_image_url, "image_hash": file_hash, "address": address, "road_name": road_name, "assigned_authority": authority, "citizen_description": description,
             **(({"severity": ai_res.severity, "infra_type": ai_res.infra_type, "ai_confidence": ai_res.ai_confidence, "ai_description": ai_res.ai_description, "impact_score": ai_res.impact_score, "status": ReportStatus.PENDING}) if ai_res else {})}
    rep = Report(**data); db.add(rep); await db.commit(); await db.refresh(rep)
    return rep

@app.get(f"{settings.API_V1_STR}/issues", response_model=List[ReportResponse])
async def get_reports(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return (await db.execute(select(Report).offset(skip).limit(limit))).scalars().all()

@app.patch(f"{settings.API_V1_STR}/issues/{{id}}", response_model=ReportResponse)
async def update_report(id: int, r_update: ReportUpdate, db: AsyncSession = Depends(get_db)):
    rep = (await db.execute(select(Report).where(Report.id == id))).scalar_one_or_none()
    if not rep: raise HTTPException(status_code=404, detail="Incident not found")
    for k, v in r_update.model_dump(exclude_unset=True).items(): setattr(rep, k, v)
    await db.commit(); await db.refresh(rep); return rep

@app.post(f"{settings.API_V1_STR}/issues/{{id}}/upvote", response_model=ReportResponse)
async def upvote_report(id: int, db: AsyncSession = Depends(get_db)):
    rep = (await db.execute(select(Report).where(Report.id == id))).scalar_one_or_none()
    if not rep: raise HTTPException(status_code=404, detail="Incident not found")
    rep.upvotes = (rep.upvotes or 0) + 1
    if rep.upvotes > 0 and rep.upvotes % 10 == 0: rep.impact_score = min(100, (rep.impact_score or 0) + max(1, int((rep.impact_score or 0) * 0.05)))
    await db.commit(); await db.refresh(rep); return rep

@app.get(f"{settings.API_V1_STR}/issues/{{id}}/challan", response_class=HTMLResponse)
async def generate_challan(id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Report).where(Report.id == id))
    rep = res.scalar_one_or_none()
    if not rep: raise HTTPException(status_code=404, detail="Incident not found")
    items = [
        ("Report ID", f"#{rep.id}"),
        ("Severity Level", str(rep.severity.value if hasattr(rep.severity, "value") else rep.severity)),
        ("Hazard Type", str(rep.infra_type.value if hasattr(rep.infra_type, "value") else rep.infra_type)),
        ("Assigned Authority", str(rep.assigned_authority.value if hasattr(rep.assigned_authority, "value") else rep.assigned_authority)),
        ("GPS Coordinates", f"{rep.latitude:.6f}, {rep.longitude:.6f}"),
        ("Road/Highway", rep.road_name or "UNKNOWN ROAD"),
        ("Civic Address", rep.address or "ACQUIRING..."),
        ("Generated At", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    ]
    grid_html = "\n".join(f'<div class="text-[11px] font-bold uppercase text-[#8F8D88]">{lbl}<span class="block text-sm font-black text-[#1F1E1B] mt-1 font-mono">{val}</span></div>' for lbl, val in items)
    status_str = str(rep.status.value if hasattr(rep.status, "value") else rep.status)
    html_content = f"""<!DOCTYPE html><html><head><title>RoadWatch Challan #{rep.id}</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet"><style>body {{ font-family: 'Inter', sans-serif; }} @media print {{ .no-print {{ display: none; }} body {{ background: white; }} }}</style></head><body class="bg-[#FAF9F5] text-[#1F1E1B] p-10 print:p-0 print:bg-white"><div class="max-w-[800px] mx-auto bg-white border border-black/5 rounded-3xl p-10 shadow-sm print:border-none print:shadow-none print:p-0"><div class="flex justify-between items-center border-b border-[#FAF9F5] pb-6 mb-8"><div class="text-xl font-black uppercase tracking-tighter">Road<span class="text-[#FF5A1F]">Watch</span></div><div class="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-[#FF5A1F]/10 text-[#FF5A1F] rounded-full">{status_str}</div></div><h1 class="text-3xl font-black uppercase mb-1">Work Order Challan</h1><div class="text-[#8F8D88] text-[11px] font-bold uppercase tracking-wider mb-8">Incident Report Telemetry Notice</div><div class="grid grid-cols-2 gap-5 border-y border-black/5 py-6">{grid_html}</div><div class="bg-[#FAF9F5] rounded-2xl p-5 mt-6"><div class="text-[10px] font-black uppercase text-[#8F8D88] mb-2 tracking-wide">Citizen Description</div><div class="text-sm font-bold leading-normal">{rep.citizen_description or "No description provided by reporter."}</div></div><div class="bg-[#FAF9F5] rounded-2xl p-5 mt-6"><div class="text-[10px] font-black uppercase text-[#8F8D88] mb-2 tracking-wide">AI Engine Analysis</div><div class="text-sm font-bold leading-normal">{rep.ai_description or "Triage completed with standard parameters."}</div></div><button class="no-print block w-fit mx-auto mt-8 bg-[#FF5A1F] hover:bg-[#E84E15] text-white py-3 px-6 text-[11px] font-black uppercase tracking-widest rounded-full cursor-pointer transition-transform active:scale-95 shadow-md" onclick="window.print()">Print / Save PDF</button><div class="text-center mt-10 text-[#8F8D88] text-[10px] font-bold uppercase tracking-widest">RoadWatch Civic Infrastructure Security &copy; 2026</div></div><script>window.onload = () => setTimeout(() => window.print(), 300);</script></body></html>"""
    return HTMLResponse(content=html_content)