"""
IoT Sensor Data Source
Supports air quality sensors, energy meters, and industrial emission monitors
"""
import requests
import os
from datetime import datetime
from typing import List, Dict, Optional
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from config import APIConfig


class IoTSensorSource:
    """Base class for IoT sensor data sources"""
    
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        } if api_key else {"Content-Type": "application/json"}
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_data(self, location: Optional[Dict] = None, date_range: Optional[Dict] = None) -> Dict:
        """Fetch IoT sensor data"""
        raise NotImplementedError("Subclasses must implement fetch_data")
    
    def normalize_data(self, raw_data: Dict) -> List[Dict]:
        """Normalize IoT sensor data to standard format"""
        raise NotImplementedError("Subclasses must implement normalize_data")


class AirQualitySource(IoTSensorSource):
    """Air quality sensor data source (OpenAQ)"""
    
    def __init__(self):
        super().__init__(APIConfig.AIR_QUALITY_API_URL, APIConfig.AIR_QUALITY_API_KEY)
    
    def fetch_data(self, location: Optional[Dict] = None, date_range: Optional[Dict] = None) -> Dict:
        """Fetch air quality data from OpenAQ"""
        try:
            # OpenAQ API endpoint
            endpoint = f"{self.api_url}/measurements"
            params = {
                "limit": 1000,
                "page": 1
            }
            
            if location:
                params.update({
                    "coordinates": f"{location.get('lat')},{location.get('lon')}",
                    "radius": location.get("radius", 10000)  # meters
                })
            
            if date_range:
                params.update({
                    "date_from": date_range.get("start"),
                    "date_to": date_range.get("end")
                })
            
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Fetched air quality data: {len(data.get('results', []))} records")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching air quality data: {e}")
            raise
    
    def normalize_data(self, raw_data: Dict) -> List[Dict]:
        """Normalize air quality data to standard format"""
        normalized = []
        
        for entry in raw_data.get("results", []):
            try:
                # Convert air quality measurements to CO2 equivalent
                # This is a simplified conversion - adjust based on actual requirements
                co2_tons = self._calculate_co2_equivalent(entry)
                
                if co2_tons > 0:
                    normalized_entry = {
                        "project_id": f"air_quality_{entry.get('location', {}).get('id', 'unknown')}",
                        "co2_tons": co2_tons,
                        "timestamp": entry.get("date", {}).get("utc", datetime.utcnow().isoformat()),
                        "source": "air_quality_sensor",
                        "location": {
                            "lat": entry.get("location", {}).get("coordinates", {}).get("latitude"),
                            "lon": entry.get("location", {}).get("coordinates", {}).get("longitude")
                        },
                        "metadata": {
                            "parameter": entry.get("parameter"),
                            "value": entry.get("value"),
                            "unit": entry.get("unit")
                        }
                    }
                    normalized.append(normalized_entry)
            except (ValueError, KeyError) as e:
                logger.warning(f"Skipping invalid entry: {e}")
                continue
        
        return normalized
    
    def _calculate_co2_equivalent(self, entry: Dict) -> float:
        """Calculate CO2 equivalent from air quality measurements"""
        # Simplified conversion - adjust based on actual requirements
        parameter = entry.get("parameter", "").lower()
        value = float(entry.get("value", 0))
        
        # Conversion factors (example values - adjust based on actual data)
        conversion_factors = {
            "co2": 1.0,  # Already in CO2
            "pm2.5": 0.0001,  # Example conversion
            "pm10": 0.00008,  # Example conversion
            "no2": 0.0005,  # Example conversion
        }
        
        factor = conversion_factors.get(parameter, 0)
        return value * factor / 1000  # Convert to tons


class EnergyMeterSource(IoTSensorSource):
    """Smart energy meter data source"""
    
    def __init__(self):
        super().__init__(APIConfig.ENERGY_METER_API_URL, APIConfig.ENERGY_METER_API_KEY)
    
    def fetch_data(self, location: Optional[Dict] = None, date_range: Optional[Dict] = None) -> Dict:
        """Fetch energy meter data"""
        try:
            endpoint = f"{self.api_url}/readings"
            params = {}
            
            if location:
                params.update({
                    "location_id": location.get("location_id")
                })
            
            if date_range:
                params.update({
                    "start_date": date_range.get("start"),
                    "end_date": date_range.get("end")
                })
            
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            logger.info(f"Fetched energy meter data: {len(response.json().get('readings', []))} records")
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching energy meter data: {e}")
            raise
    
    def normalize_data(self, raw_data: Dict) -> List[Dict]:
        """Normalize energy meter data to standard format"""
        normalized = []
        
        for reading in raw_data.get("readings", []):
            try:
                # Convert energy consumption to CO2 equivalent
                # Standard conversion: 1 MWh ≈ 0.5 tons CO2 (varies by grid)
                energy_kwh = float(reading.get("energy_kwh", 0))
                co2_tons = (energy_kwh / 1000) * 0.5  # Convert to MWh then to CO2 tons
                
                if co2_tons > 0:
                    normalized_entry = {
                        "project_id": f"energy_meter_{reading.get('meter_id', 'unknown')}",
                        "co2_tons": co2_tons,
                        "timestamp": reading.get("timestamp", datetime.utcnow().isoformat()),
                        "source": "energy_meter",
                        "location": reading.get("location", {}),
                        "metadata": {
                            "energy_kwh": energy_kwh,
                            "meter_id": reading.get("meter_id")
                        }
                    }
                    normalized.append(normalized_entry)
            except (ValueError, KeyError) as e:
                logger.warning(f"Skipping invalid entry: {e}")
                continue
        
        return normalized


class EmissionMonitorSource(IoTSensorSource):
    """Industrial emission monitor data source"""
    
    def __init__(self):
        super().__init__(APIConfig.EMISSION_MONITOR_API_URL, APIConfig.EMISSION_MONITOR_API_KEY)
    
    def fetch_data(self, location: Optional[Dict] = None, date_range: Optional[Dict] = None) -> Dict:
        """Fetch industrial emission monitor data"""
        try:
            endpoint = f"{self.api_url}/emissions"
            params = {}
            
            if location:
                params.update({
                    "facility_id": location.get("facility_id")
                })
            
            if date_range:
                params.update({
                    "start_date": date_range.get("start"),
                    "end_date": date_range.get("end")
                })
            
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            logger.info(f"Fetched emission monitor data: {len(response.json().get('emissions', []))} records")
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching emission monitor data: {e}")
            raise
    
    def normalize_data(self, raw_data: Dict) -> List[Dict]:
        """Normalize emission monitor data to standard format"""
        normalized = []
        
        for emission in raw_data.get("emissions", []):
            try:
                co2_tons = float(emission.get("co2_tons", 0))
                
                if co2_tons > 0:
                    normalized_entry = {
                        "project_id": f"emission_monitor_{emission.get('monitor_id', 'unknown')}",
                        "co2_tons": co2_tons,
                        "timestamp": emission.get("timestamp", datetime.utcnow().isoformat()),
                        "source": "emission_monitor",
                        "location": emission.get("location", {}),
                        "metadata": {
                            "monitor_id": emission.get("monitor_id"),
                            "facility_id": emission.get("facility_id"),
                            "pollutant_type": emission.get("pollutant_type")
                        }
                    }
                    normalized.append(normalized_entry)
            except (ValueError, KeyError) as e:
                logger.warning(f"Skipping invalid entry: {e}")
                continue
        
        return normalized


def get_iot_sources() -> List[IoTSensorSource]:
    """Get all configured IoT sensor data sources"""
    sources = []
    
    # Air quality is often public, so we include it even without API key
    sources.append(AirQualitySource())
    
    if APIConfig.ENERGY_METER_API_KEY:
        sources.append(EnergyMeterSource())
    
    if APIConfig.EMISSION_MONITOR_API_KEY:
        sources.append(EmissionMonitorSource())
    
    return sources

