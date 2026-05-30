import os, enum, jwt
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import aiofiles
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, ConfigDict
from pydantic_settings import BaseSettings
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text, func, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

# CONFIG & SETUP
class Settings(BaseSettings):
    PROJECT_NAME: str = "RoadWatch API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite+aiosqlite:///./roadwatch.db"
    GEMINI_API_KEY: Optional[str] = None
    CORS_ALLOW_ORIGINS: Optional[str] = None
    SECRET_KEY: str = "CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ADMIN_EMAIL: str = "admin@roadwatch.com"
    ADMIN_PASSWORD: str = "CHANGE_ME"
    ADMIN_PASSWORD_HASH: Optional[str] = None
    class Config: env_file = ".env"

settings = Settings()
limiter = Limiter(key_func=get_remote_address)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True, connect_args={"check_same_thread": False})
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session: yield session

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"; VERIFIED = "VERIFIED"; REJECTED = "REJECTED"; IN_PROGRESS = "IN_PROGRESS"; RESOLVED = "RESOLVED"

class SeverityLevel(str, enum.Enum):
    LOW = "LOW"; MEDIUM = "MEDIUM"; HIGH = "HIGH"; CRITICAL = "CRITICAL"

class InfrastructureType(str, enum.Enum):
    POTHOLE = "POTHOLE"; CRACK = "CRACK"; UNPAVED = "UNPAVED"; WATERLOGGING = "WATERLOGGING"; OTHER = "OTHER"

class Authority(str, enum.Enum):
    NHAI = "NHAI"; STATE_HIGHWAY = "STATE_HIGHWAY"; MUNICIPAL = "MUNICIPAL"; UNKNOWN = "UNKNOWN"

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    image_url = Column(String, nullable=True)
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.LOW)
    infra_type = Column(Enum(InfrastructureType), default=InfrastructureType.OTHER)
    ai_confidence = Column(Float, default=0.0)
    ai_description = Column(Text, nullable=True)
    impact_score = Column(Integer, default=0)
    upvotes = Column(Integer, default=0, nullable=False)
    citizen_description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    road_name = Column(String, nullable=True)
    assigned_authority = Column(Enum(Authority), default=Authority.UNKNOWN)
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    severity: Optional[SeverityLevel] = None

class ReportResponse(BaseModel):
    id: int; latitude: float; longitude: float; image_url: Optional[str] = None
    severity: SeverityLevel; infra_type: InfrastructureType; ai_confidence: float; ai_description: Optional[str] = None
    impact_score: Optional[int] = None; upvotes: int = 0; citizen_description: Optional[str] = None
    address: Optional[str] = None; road_name: Optional[str] = None; assigned_authority: Authority
    status: ReportStatus; created_at: datetime; updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# AUTH HELPERS
def get_admin_identity():
    h = getattr(settings, "ADMIN_PASSWORD_HASH", None) or pwd_context.hash(settings.ADMIN_PASSWORD)
    return settings.ADMIN_EMAIL, h

def create_access_token(data: dict) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": exp}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    try:
        if token:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if "sub" in payload: return payload["sub"]
    except jwt.PyJWTError: pass
    raise HTTPException(status_code=401, detail="Could not validate credentials")

from app.services.helpers import analyze_image, reverse_geocode, determine_authority

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in settings.CORS_ALLOW_ORIGINS.split(",") if o.strip()] if settings.CORS_ALLOW_ORIGINS else ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root(): return {"message": "Welcome to RoadWatch API"}

@app.post(f"{settings.API_V1_STR}/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    email, pw_hash = get_admin_identity()
    if form_data.username != email or not pwd_context.verify(form_data.password, pw_hash):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    return {"access_token": create_access_token({"sub": email}), "token_type": "bearer"}

@app.post(f"{settings.API_V1_STR}/issues/submit", response_model=ReportResponse, status_code=201)
@limiter.limit("5/minute")
async def submit_report(
    request: Request, latitude: float = Form(...), longitude: float = Form(...),
    description: str = Form(None), image: UploadFile = File(None), db: AsyncSession = Depends(get_db)
):
    image_path = None
    if image:
        image_path = os.path.join("uploads", f"report_{datetime.now().strftime('%Y%m%d%H%M%S')}.{image.filename.split('.')[-1]}")
        async with aiofiles.open(image_path, 'wb') as f: await f.write(await image.read())

    ai_res = await analyze_image(image_path) if image_path else None
    address, road_name = await reverse_geocode(latitude, longitude)
    authority = determine_authority(road_name)

    data = {"latitude": latitude, "longitude": longitude, "image_url": image_path, "address": address, "road_name": road_name, "assigned_authority": authority, "citizen_description": description}
    if ai_res:
        data.update({"severity": ai_res.severity, "infra_type": ai_res.infra_type, "ai_confidence": ai_res.ai_confidence, "ai_description": ai_res.ai_description, "impact_score": ai_res.impact_score})
    rep = Report(**data); db.add(rep); await db.commit(); await db.refresh(rep)
    return rep

@app.get(f"{settings.API_V1_STR}/issues", response_model=List[ReportResponse])
async def get_reports(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Report).offset(skip).limit(limit))
    return res.scalars().all()

@app.patch(f"{settings.API_V1_STR}/issues/{{id}}", response_model=ReportResponse)
async def update_report(id: int, r_update: ReportUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Report).where(Report.id == id))
    rep = res.scalar_one_or_none()
    if not rep: raise HTTPException(status_code=404, detail="Incident not found")
    for k, v in r_update.model_dump(exclude_unset=True).items(): setattr(rep, k, v)
    await db.commit(); await db.refresh(rep)
    return rep

@app.post(f"{settings.API_V1_STR}/issues/{{id}}/upvote", response_model=ReportResponse)
async def upvote_report(id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Report).where(Report.id == id))
    rep = res.scalar_one_or_none()
    if not rep: raise HTTPException(status_code=404, detail="Incident not found")
    rep.upvotes = (rep.upvotes or 0) + 1
    if rep.upvotes > 0 and rep.upvotes % 10 == 0:
        c = rep.impact_score or 0
        rep.impact_score = min(100, c + max(1, int(c * 0.05)))
    await db.commit(); await db.refresh(rep)
    return rep

@app.get(f"{settings.API_V1_STR}/ledger/stats")
async def get_ledger_stats(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Report.assigned_authority, Report.status, func.count(Report.id)).group_by(Report.assigned_authority, Report.status))
    stats = {}
    for auth, stat_item, count in res.all():
        a = auth.value if hasattr(auth, 'value') else str(auth)
        s = stat_item.value if hasattr(stat_item, 'value') else str(stat_item)
        if a not in stats: stats[a] = {}
        stats[a][s] = count
    return {"data": stats}
