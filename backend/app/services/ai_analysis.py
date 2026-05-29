import logging
from typing import Optional
from pydantic import BaseModel, Field
from google import genai
from app.core.config import settings
from app.models.report import SeverityLevel, InfrastructureType

logger = logging.getLogger(__name__)

class AIAnalysisResult(BaseModel):
    severity: SeverityLevel = Field(description="The severity level of the road damage.")
    infra_type: InfrastructureType = Field(description="The type of infrastructure damage.")
    ai_confidence: float = Field(description="Confidence score between 0.0 and 1.0.")
    ai_description: str = Field(description="A brief description of the damage found in the image.")
    impact_score: int = Field(description="An impact score from 1-100 calculating how dangerous or disruptive this issue is.")

async def analyze_image(image_path: str) -> AIAnalysisResult:
    if not settings.GEMINI_API_KEY:
        logger.warning("No GEMINI_API_KEY provided. Using mock AI analysis.")
        return get_mock_analysis()

    try:
        # Initialize Gemini Client
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        # Upload the file to Gemini (assuming image_path is a local path)
        # Using PIL to load the image if needed, or simply passing the file
        # Here we pass the local path to upload_file
        # Note: If it's a URL, you'd need to download it first.
        # Assuming local path from frontend upload:
        import pathlib
        if not pathlib.Path(image_path).exists():
            return get_mock_analysis()
        
        # Load image via PIL to send directly (bypasses File API requirements)
        from PIL import Image
        img = Image.open(image_path)
        
        prompt = (
            "Analyze this image of a road. Identify any infrastructure damage like potholes, cracks, or waterlogging. "
            "IMPORTANT REJECTION RULE: If this image does NOT contain a road, highway, street, sidewalk, or any road-related infrastructure, "
            "classify it immediately as follows: set 'infra_type' to 'OTHER', 'severity' to 'LOW', 'impact_score' to 0, 'ai_confidence' to 1.0, "
            "and in 'ai_description' clearly explain that the image is invalid and does not show road infrastructure.\n\n"
            "If it IS a valid road image, identify the damage and assess the severity. "
            "You MUST use only these exact values for the schema:\n"
            "- 'severity': 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'\n"
            "- 'infra_type': 'POTHOLE', 'CRACK', 'UNPAVED', 'WATERLOGGING', or 'OTHER'\n"
            "- 'impact_score': integer from 1 to 100 based on the danger level."
        )
        
        from google.genai import types
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[img, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIAnalysisResult,
            ),
        )
        
        # Parse structured output with high cased-string & synonym tolerance
        import json
        if response.text:
            try:
                # Clean up any potential markdown wrapper
                clean_text = response.text.strip()
                if clean_text.startswith("```"):
                    start = clean_text.find("{")
                    end = clean_text.rfind("}") + 1
                    clean_text = clean_text[start:end]
                
                data = json.loads(clean_text)
                
                # 1. Standardize Severity cased strings/synonyms
                sev = str(data.get("severity", "LOW")).strip().upper()
                if sev in ["MINOR", "LOW"]:
                    data["severity"] = SeverityLevel.LOW
                elif sev in ["MODERATE", "MEDIUM"]:
                    data["severity"] = SeverityLevel.MEDIUM
                elif sev in ["HIGH", "SEVERE"]:
                    data["severity"] = SeverityLevel.HIGH
                elif sev in ["CRITICAL", "EXTREME"]:
                    data["severity"] = SeverityLevel.CRITICAL
                else:
                    data["severity"] = SeverityLevel.LOW
                
                # 2. Standardize Infrastructure Type cased strings/synonyms
                infra = str(data.get("infra_type", "OTHER")).strip().upper()
                if "POTHOLE" in infra:
                    data["infra_type"] = InfrastructureType.POTHOLE
                elif "CRACK" in infra or "FRACTURE" in infra:
                    data["infra_type"] = InfrastructureType.CRACK
                elif "UNPAVED" in infra or "DIRT" in infra or "GRAVEL" in infra:
                    data["infra_type"] = InfrastructureType.UNPAVED
                elif "WATER" in infra or "LOGGING" in infra or "FLOOD" in infra:
                    data["infra_type"] = InfrastructureType.WATERLOGGING
                else:
                    data["infra_type"] = InfrastructureType.OTHER
                
                # Re-validate with Pydantic
                return AIAnalysisResult(**data)
            except Exception as parse_err:
                logger.error(f"Error parsing/validating Gemini response: {parse_err}. Raw text: {response.text}")
                return get_mock_analysis()
            
        return get_mock_analysis()
    except Exception as e:
        logger.error(f"Error during AI analysis: {e}")
        return get_mock_analysis()

def get_mock_analysis() -> AIAnalysisResult:
    return AIAnalysisResult(
        severity=SeverityLevel.MEDIUM,
        infra_type=InfrastructureType.POTHOLE,
        ai_confidence=0.85,
        ai_description="Mock analysis: Medium sized pothole detected on the road surface.",
        impact_score=65
    )
