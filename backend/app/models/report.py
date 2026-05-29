from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

class SeverityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class InfrastructureType(str, enum.Enum):
    POTHOLE = "POTHOLE"
    CRACK = "CRACK"
    UNPAVED = "UNPAVED"
    WATERLOGGING = "WATERLOGGING"
    OTHER = "OTHER"

class Authority(str, enum.Enum):
    NHAI = "NHAI"
    STATE_HIGHWAY = "STATE_HIGHWAY"
    MUNICIPAL = "MUNICIPAL"
    UNKNOWN = "UNKNOWN"

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    image_url = Column(String, nullable=True) # Storing file path or URL
    
    # AI Analysis Fields
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.LOW)
    infra_type = Column(Enum(InfrastructureType), default=InfrastructureType.OTHER)
    ai_confidence = Column(Float, default=0.0)
    ai_description = Column(Text, nullable=True)
    impact_score = Column(Integer, default=0)
    upvotes = Column(Integer, default=0, nullable=False)

    # Citizen-provided optional notes
    citizen_description = Column(Text, nullable=True)
    
    # Geocoding & Routing
    address = Column(Text, nullable=True)
    road_name = Column(String, nullable=True)
    assigned_authority = Column(Enum(Authority), default=Authority.UNKNOWN)
    
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
