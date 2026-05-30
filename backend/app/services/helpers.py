import logging
import asyncio
from typing import Tuple, Optional
from pydantic import BaseModel, Field
from google import genai
from PIL import Image
from geopy.geocoders import Nominatim

logger = logging.getLogger(__name__)
geolocator = Nominatim(user_agent="roadwatch_api")

class AIAnalysisResult(BaseModel):
    severity: str = Field(description="LOW, MEDIUM, HIGH, CRITICAL")
    infra_type: str = Field(description="POTHOLE, CRACK, UNPAVED, WATERLOGGING, OTHER")
    ai_confidence: float = Field(description="0.0 to 1.0")
    ai_description: str = Field(description="Description of damage.")
    impact_score: int = Field(description="1 to 100")

async def analyze_image(image_path: str) -> AIAnalysisResult:
    from app.main import settings
    if not settings.GEMINI_API_KEY:
        return get_mock_analysis()
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        img = Image.open(image_path)
        prompt = "Analyze this road damage. Classify type (POTHOLE, CRACK, UNPAVED, WATERLOGGING, OTHER), severity (LOW, MEDIUM, HIGH, CRITICAL), and assign impact score (1-100)."
        response = client.models.generate_content(
            model="gemini-1.5-flash", contents=[img, prompt],
            config={"response_mime_type": "application/json", "response_schema": AIAnalysisResult}
        )
        if response.text:
            import json
            return AIAnalysisResult(**json.loads(response.text))
    except Exception as e:
        logger.error(f"AI failed, using mock fallback: {e}")
    return get_mock_analysis()

def get_mock_analysis() -> AIAnalysisResult:
    return AIAnalysisResult(severity="MEDIUM", infra_type="POTHOLE", ai_confidence=0.85, ai_description="Mock pothole detected.", impact_score=65)

async def reverse_geocode(lat: float, lon: float) -> Tuple[Optional[str], Optional[str]]:
    try:
        loc = await asyncio.to_thread(geolocator.reverse, (lat, lon), exactly_one=True, timeout=10)
        if loc:
            raw = loc.raw.get('address', {})
            return loc.address, raw.get('road') or raw.get('highway')
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
    return None, None

def determine_authority(road_name: str) -> str:
    if not road_name:
        return "MUNICIPAL"
    n = road_name.upper()
    if "NH" in n or "NATIONAL HIGHWAY" in n:
        return "NHAI"
    if "SH" in n or "STATE HIGHWAY" in n:
        return "STATE_HIGHWAY"
    return "MUNICIPAL"
