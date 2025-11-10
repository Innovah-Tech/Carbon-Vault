"""
Satellite Imagery Data Source
Supports Planet Labs, Sentinel-2, and Landsat
"""
import requests
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from config import APIConfig


class SatelliteDataSource:
    """Base class for satellite data sources"""
    
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_data(self, start_date: str, end_date: str, location: Optional[Dict] = None) -> Dict:
        """Fetch satellite data for a given date range and location"""
        raise NotImplementedError("Subclasses must implement fetch_data")
    
    def normalize_data(self, raw_data: Dict) -> List[Dict]:
        """Normalize satellite data to standard format"""
        raise NotImplementedError("Subclasses must implement normalize_data")


class PlanetLabsSource(SatelliteDataSource):
    """Planet Labs satellite data source"""
    
    def __init__(self):
        super().__init__(APIConfig.PLANET_LABS_API_URL, APIConfig.PLANET_LABS_API_KEY)
    
    def fetch_data(self, start_date: str, end_date: str, location: Optional[Dict] = None) -> Dict:
        """Fetch Planet Labs satellite data"""
        try:
            # Example endpoint - adjust based on actual Planet Labs API
            endpoint = f"{self.api_url}/emissions"
            params = {
                "start_date": start_date,
                "end_date": end_date,
            }
            
            if location:
                params.update({
                    "lat": location.get("lat"),
                    "lon": location.get("lon"),
                    "radius": location.get("radius", 1000)  # meters
                })
            
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            logger.info(f"Fetched Planet Labs data: {len(response.json().get('results', []))} records")
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching Planet Labs data: {e}")
            raise
    
    def normalize_data(self, raw_data: Dict) -> List[Dict]:
        """Normalize Planet Labs data to standard format"""
        normalized = []
        
        for entry in raw_data.get("results", []):
            try:
                normalized_entry = {
                    "project_id": entry.get("project_id", f"planet_{entry.get('id', 'unknown')}"),
                    "co2_tons": float(entry.get("co2_tons", 0)),
                    "timestamp": entry.get("timestamp", datetime.utcnow().isoformat()),
                    "source": "planet_labs",
                    "location": entry.get("location", {}),
                    "metadata": {
                        "satellite": entry.get("satellite"),
                        "resolution": entry.get("resolution"),
                        "cloud_cover": entry.get("cloud_cover")
                    }
                }
                normalized.append(normalized_entry)
            except (ValueError, KeyError) as e:
                logger.warning(f"Skipping invalid entry: {e}")
                continue
        
        return normalized


class Sentinel2Source(SatelliteDataSource):
    """Sentinel-2 (ESA) satellite data source"""
    
    def __init__(self):
        super().__init__(APIConfig.SENTINEL2_API_URL, APIConfig.SENTINEL2_API_KEY)
    
    def fetch_data(self, start_date: str, end_date: str, location: Optional[Dict] = None) -> Dict:
        """Fetch Sentinel-2 satellite data"""
        try:
            # Example endpoint - adjust based on actual Sentinel-2 API
            endpoint = f"{self.api_url}/search"
            params = {
                "start": start_date,
                "end": end_date,
                "platformname": "Sentinel-2"
            }
            
            if location:
                params.update({
                    "bbox": f"{location.get('lon')},{location.get('lat')}"
                })
            
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            logger.info(f"Fetched Sentinel-2 data: {len(response.json().get('features', []))} records")
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching Sentinel-2 data: {e}")
            raise
    
    def normalize_data(self, raw_data: Dict) -> List[Dict]:
        """Normalize Sentinel-2 data to standard format"""
        normalized = []
        
        for feature in raw_data.get("features", []):
            try:
                properties = feature.get("properties", {})
                normalized_entry = {
                    "project_id": properties.get("id", f"sentinel2_{feature.get('id', 'unknown')}"),
                    "co2_tons": float(properties.get("co2_tons", 0)),
                    "timestamp": properties.get("datetime", datetime.utcnow().isoformat()),
                    "source": "sentinel2",
                    "location": feature.get("geometry", {}),
                    "metadata": {
                        "satellite": "Sentinel-2",
                        "cloud_cover": properties.get("cloudcoverpercentage", 0)
                    }
                }
                normalized.append(normalized_entry)
            except (ValueError, KeyError) as e:
                logger.warning(f"Skipping invalid entry: {e}")
                continue
        
        return normalized


class LandsatSource(SatelliteDataSource):
    """Landsat (USGS) satellite data source"""
    
    def __init__(self):
        # Use USGS STAC API (free, no key required)
        super().__init__("https://landsatlook.usgs.gov/stac-server", "")
    
    def fetch_data(self, start_date: str, end_date: str, location: Optional[Dict] = None) -> Dict:
        """Fetch Landsat satellite data from USGS STAC"""
        try:
            # Search endpoint for Landsat Collection 2
            endpoint = f"{self.api_url}/search"
            
            params = {
                "collections": ["landsat-c2l2"],
                "datetime": f"{start_date}/{end_date}",
                "limit": 50
            }
            
            # Add location bounding box if provided
            if location and location.get("lat") and location.get("lon"):
                radius_deg = location.get("radius", 10000) / 111000  # Convert meters to degrees
                bbox = [
                    location.get("lon") - radius_deg,
                    location.get("lat") - radius_deg,
                    location.get("lon") + radius_deg,
                    location.get("lat") + radius_deg
                ]
                params["bbox"] = bbox
            
            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Fetched Landsat data: {len(data.get('features', []))} records")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching Landsat data: {e}")
            raise
    
    def normalize_data(self, raw_data: Dict) -> List[Dict]:
        """Normalize Landsat data to standard format"""
        normalized = []
        
        for feature in raw_data.get("features", []):
            try:
                properties = feature.get("properties", {})
                geometry = feature.get("geometry", {})
                
                # Extract coordinates from geometry
                coordinates = geometry.get("coordinates", [[[[0, 0]]]])[0][0]
                
                # Calculate rough carbon impact from cloud cover and vegetation indices
                # Lower cloud cover and healthier vegetation (higher NDVI) = better carbon sequestration
                cloud_cover = float(properties.get("eo:cloud_cover", 50))
                
                # Estimate CO2 sequestration: healthy forest sequesters ~2.4 tons/hectare/year
                # Landsat scene is 185x185 km = 34,225 hectares
                # Per scene, assuming 30% vegetation cover and discounting for cloud cover
                vegetation_factor = (100 - cloud_cover) / 100 * 0.3
                co2_tons = 34225 * 2.4 * vegetation_factor / 365 / 1000  # Daily estimate
                
                normalized_entry = {
                    "project_id": f"landsat_{feature.get('id', 'unknown')}",
                    "co2_tons": max(0, co2_tons),
                    "timestamp": properties.get("datetime", datetime.utcnow().isoformat()),
                    "source": "landsat",
                    "location": {
                        "lat": coordinates[1] if len(coordinates) > 1 else 0,
                        "lon": coordinates[0] if len(coordinates) > 0 else 0,
                        "type": "scene"
                    },
                    "metadata": {
                        "satellite": "Landsat-8/9",
                        "cloud_cover": cloud_cover,
                        "asset": properties.get("landsat:product_id", ""),
                        "processing_level": properties.get("eo:processing_level", "L2")
                    }
                }
                normalized.append(normalized_entry)
            except (ValueError, KeyError, IndexError, TypeError) as e:
                logger.warning(f"Skipping invalid Landsat entry: {e}")
                continue
        
        return normalized


def get_satellite_sources() -> List[SatelliteDataSource]:
    """Get all configured satellite data sources"""
    sources = []
    
    if APIConfig.PLANET_LABS_API_KEY:
        sources.append(PlanetLabsSource())
    
    if APIConfig.SENTINEL2_API_KEY:
        sources.append(Sentinel2Source())
    
    if APIConfig.LANDSAT_API_KEY:
        sources.append(LandsatSource())
    
    return sources

