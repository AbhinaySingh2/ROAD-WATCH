from app.models.report import Authority

def determine_authority(road_name: str) -> Authority:
    """
    Simple rule-based engine to determine authority based on road name.
    """
    if not road_name:
        return Authority.MUNICIPAL
        
    road_name_upper = road_name.upper()
    
    if "NH" in road_name_upper or "NATIONAL HIGHWAY" in road_name_upper:
        return Authority.NHAI
        
    if "SH" in road_name_upper or "STATE HIGHWAY" in road_name_upper:
        return Authority.STATE_HIGHWAY
        
    # Default fallback
    return Authority.MUNICIPAL
