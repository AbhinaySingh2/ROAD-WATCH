from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.report import ReportStatus, SeverityLevel, InfrastructureType, Authority

class ReportCreate(BaseModel):
    latitude: float
    longitude: float
    image_url: Optional[str] = None

class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    severity: Optional[SeverityLevel] = None

class ReportResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    
    severity: SeverityLevel
    infra_type: InfrastructureType
    ai_confidence: float
    ai_description: Optional[str] = None
    impact_score: Optional[int] = None
    upvotes: int = 0

    citizen_description: Optional[str] = None
    
    address: Optional[str] = None
    road_name: Optional[str] = None
    assigned_authority: Authority
    
    status: ReportStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
