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
    """Air quality sensor data source (OpenAQ API v2)"""
    
    def __init__(self):
        # OpenAQ API v2 is public, no key required
        super().__init__("https://api.openaq.org/v2", "")
    
    def fetch_data(self, location: Optional[Dict] = None, date_range: Optional[Dict] = None) -> Dict:
        """Fetch air quality data from OpenAQ"""
        try:
            # OpenAQ API v2 endpoint - returns latest measurements
            endpoint = f"{self.api_url}/latest"
            params = {
                "limit": 100,
                "offset": 0
            }
            
            # Use location for city filtering if available
            if location and location.get("city"):
                params["city"] = location.get("city")
            elif location and location.get("country"):
                params["country"] = location.get("country")
            
            response = requests.get(endpoint, params=params, timeout=30)
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
                # Extract measurements
                measurements = entry.get("measurements", [])
                
                for measurement in measurements:
                    # Convert air quality measurements to CO2 equivalent
                    co2_tons = self._calculate_co2_equivalent(measurement)
                    
                    if co2_tons > 0:
                        location_data = entry.get("coordinates", {})
                        normalized_entry = {
                            "project_id": f"air_quality_{entry.get('location', 'unknown')}",
                            "co2_tons": co2_tons,
                            "timestamp": entry.get("lastUpdated", datetime.utcnow().isoformat()),
                            "source": "air_quality_sensor",
                            "location": {
                                "lat": location_data.get("latitude"),
                                "lon": location_data.get("longitude"),
                                "city": entry.get("city"),
                                "country": entry.get("country")
                            },
                            "metadata": {
                                "parameter": measurement.get("parameter"),
                                "value": measurement.get("value"),
                                "unit": measurement.get("unit"),
                                "location_name": entry.get("location")
                            }
                        }
                        normalized.append(normalized_entry)
            except (ValueError, KeyError, TypeError) as e:
                logger.warning(f"Skipping invalid entry: {e}")
                continue
        
        return normalized
    
    def _calculate_co2_equivalent(self, measurement: Dict) -> float:
        """Calculate CO2 equivalent from air quality measurements"""
        parameter = measurement.get("parameter", "").lower()
        value = float(measurement.get("value", 0))
        
        # Conversion factors to CO2 equivalent (in kg)
        # Based on Global Warming Potential (GWP) and atmospheric concentrations
        conversion_factors = {
            "co2": 1.0,  # Already in CO2
            "pm2.5": 0.000012,  # PM2.5 to CO2 eq (rough estimate)
            "pm10": 0.000008,  # PM10 to CO2 eq
            "no2": 0.00028,  # NO2 to CO2 eq (GWP: ~280 over 100 years)
            "o3": 0.00001,  # O3 to CO2 eq
            "so2": 0.00015,  # SO2 to CO2 eq
            "co": 0.000003,  # CO to CO2 eq
        }
        
        factor = conversion_factors.get(parameter, 0)
        co2_kg = value * factor  # Value in kg CO2 equivalent
        return co2_kg / 1000  # Convert to tons


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


class WeatherDataSource(IoTSensorSource):
    """Weather and climate data source (NOAA)"""
    
    def __init__(self):
        # NOAA API is public, no key required
        super().__init__("https://api.weather.gov", "")
    
    def fetch_data(self, location: Optional[Dict] = None, date_range: Optional[Dict] = None) -> Dict:
        """Fetch weather data from NOAA"""
        try:
            if not location or not location.get("lat") or not location.get("lon"):
                logger.warning("Weather data requires latitude and longitude")
                return {"features": []}
            
            lat = location.get("lat")
            lon = location.get("lon")
            
            # Get grid point data
            points_endpoint = f"{self.api_url}/points/{lat},{lon}"
            points_response = requests.get(points_endpoint, timeout=30)
            points_response.raise_for_status()
            points_data = points_response.json()
            
            # Get forecast URL from points data
            forecast_url = points_data.get("properties", {}).get("forecast")
            if not forecast_url:
                logger.warning("No forecast URL available for this location")
                return {"features": []}
            
            # Get forecast data
            forecast_response = requests.get(forecast_url, timeout=30)
            forecast_response.raise_for_status()
            forecast_data = forecast_response.json()
            
            logger.info(f"Fetched weather data: {len(forecast_data.get('properties', {}).get('periods', []))} periods")
            return forecast_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching weather data: {e}")
            raise
    
    def normalize_data(self, raw_data: Dict) -> List[Dict]:
        """Normalize weather data to standard format"""
        normalized = []
        
        try:
            periods = raw_data.get("properties", {}).get("periods", [])
            
            for period in periods:
                try:
                    # Convert temperature and conditions to carbon impact estimate
                    temp_f = period.get("temperature", 70)
                    
                    # Estimate CO2 from heating/cooling needs (simplified)
                    # Average: 1 ton CO2 per 1000 sq ft per year for heating/cooling
                    # Normalized to per-period basis
                    if temp_f < 65:  # Heating needed
                        co2_tons = (65 - temp_f) * 0.0001
                    elif temp_f > 78:  # Cooling needed
                        co2_tons = (temp_f - 78) * 0.00008
                    else:
                        co2_tons = 0.00001  # Minimal HVAC
                    
                    normalized_entry = {
                        "project_id": f"weather_{period.get('startTime', 'unknown')[:10]}",
                        "co2_tons": co2_tons,
                        "timestamp": period.get("startTime", datetime.utcnow().isoformat()),
                        "source": "weather_station",
                        "location": {},
                        "metadata": {
                            "temperature": temp_f,
                            "humidity": period.get("relativeHumidity", {}).get("value"),
                            "wind_speed": period.get("windSpeed", ""),
                            "sky_condition": period.get("skyCover", ""),
                            "short_forecast": period.get("shortForecast")
                        }
                    }
                    normalized.append(normalized_entry)
                except (ValueError, KeyError, TypeError) as e:
                    logger.warning(f"Skipping invalid weather entry: {e}")
                    continue
        except (ValueError, KeyError, TypeError) as e:
            logger.warning(f"Error parsing weather data: {e}")
        
        return normalized


def get_iot_sources() -> List[IoTSensorSource]:
    """Get all configured IoT sensor data sources"""
    sources = []
    
    # Air quality is often public, so we include it even without API key
    sources.append(AirQualitySource())
    
    # Weather data is public
    sources.append(WeatherDataSource())
    
    if APIConfig.ENERGY_METER_API_KEY:
        sources.append(EnergyMeterSource())
    
    if APIConfig.EMISSION_MONITOR_API_KEY:
        sources.append(EmissionMonitorSource())
    
    return sources

