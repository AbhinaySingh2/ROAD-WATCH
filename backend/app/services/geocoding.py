from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

# It is a good practice to use a custom user_agent
geolocator = Nominatim(user_agent="roadwatch_api")

async def reverse_geocode(latitude: float, longitude: float) -> Tuple[Optional[str], Optional[str]]:
    """
    Returns (address, road_name) based on latitude and longitude.
    """
    try:
        # In a real async application, we might want to wrap this in asyncio.to_thread
        # because geopy is synchronous.
        import asyncio
        location = await asyncio.to_thread(
            geolocator.reverse, 
            (latitude, longitude), 
            exactly_one=True, 
            timeout=10
        )
        
        if location:
            address = location.address
            raw = location.raw.get('address', {})
            road_name = raw.get('road') or raw.get('highway')
            return address, road_name
            
        return None, None
    except (GeocoderTimedOut, GeocoderUnavailable) as e:
        logger.error(f"Geocoding error: {e}")
        return None, None
    except Exception as e:
        logger.error(f"Unexpected geocoding error: {e}")
        return None, None
