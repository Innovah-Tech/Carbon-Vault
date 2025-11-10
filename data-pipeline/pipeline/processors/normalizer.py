"""
Data Normalization and Cleaning
Standardizes units, formats, and validates data quality
"""
from typing import List, Dict, Any
from datetime import datetime
from loguru import logger
from pydantic import BaseModel, Field, validator

from config import ProcessingConfig


class CarbonDataPoint(BaseModel):
    """Validated carbon data point model"""
    project_id: str = Field(..., description="Unique project identifier")
    co2_tons: float = Field(..., ge=ProcessingConfig.MIN_CO2_TONS, le=ProcessingConfig.MAX_CO2_TONS)
    timestamp: str = Field(..., description="ISO format timestamp")
    source: str = Field(..., description="Data source identifier")
    location: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    verification_status: str = Field(default="pending")
    
    @validator('co2_tons')
    def round_co2_tons(cls, v):
        """Round CO2 tons to specified decimal places"""
        return round(v, ProcessingConfig.DEFAULT_DECIMAL_PLACES)
    
    @validator('timestamp')
    def validate_timestamp(cls, v):
        """Validate timestamp format"""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError(f"Invalid timestamp format: {v}")
    
    class Config:
        extra = "allow"  # Allow additional fields


class DataNormalizer:
    """Normalize and clean carbon data"""
    
    def __init__(self):
        self.config = ProcessingConfig
    
    def normalize(self, raw_data: List[Dict]) -> List[Dict]:
        """
        Normalize raw data to standard format
        
        Args:
            raw_data: List of raw data dictionaries
            
        Returns:
            List of normalized data dictionaries
        """
        normalized = []
        
        for entry in raw_data:
            try:
                normalized_entry = self._normalize_entry(entry)
                if normalized_entry:
                    normalized.append(normalized_entry)
            except Exception as e:
                logger.warning(f"Failed to normalize entry: {e}")
                continue
        
        logger.info(f"Normalized {len(normalized)}/{len(raw_data)} entries")
        return normalized
    
    def _normalize_entry(self, entry: Dict) -> Dict:
        """Normalize a single data entry"""
        # Extract required fields
        project_id = entry.get("project_id", f"unknown_{entry.get('id', 'unknown')}")
        co2_tons = self._extract_co2_tons(entry)
        timestamp = self._extract_timestamp(entry)
        source = entry.get("source", "unknown")
        
        # Build normalized entry
        normalized = {
            "project_id": str(project_id),
            "co2_tons": co2_tons,
            "timestamp": timestamp,
            "source": str(source),
            "location": entry.get("location", {}),
            "metadata": entry.get("metadata", {}),
            "verification_status": entry.get("verification_status", "pending")
        }
        
        # Validate using Pydantic model
        validated = CarbonDataPoint(**normalized)
        return validated.dict()
    
    def _extract_co2_tons(self, entry: Dict) -> float:
        """Extract and convert CO2 value to tons"""
        # Try different field names
        co2_fields = ["co2_tons", "co2_tons", "co2", "carbon_tons", "emissions_tons"]
        
        for field in co2_fields:
            if field in entry:
                value = float(entry[field])
                # Convert to tons if needed
                if "kg" in field.lower() or "kilograms" in field.lower():
                    value = value / 1000
                elif "g" in field.lower() or "grams" in field.lower():
                    value = value / 1000000
                return round(value, ProcessingConfig.DEFAULT_DECIMAL_PLACES)
        
        # If no CO2 field found, try to calculate from other metrics
        return self._calculate_co2_from_metrics(entry)
    
    def _calculate_co2_from_metrics(self, entry: Dict) -> float:
        """Calculate CO2 from other metrics if available"""
        # Example: Calculate from energy consumption
        if "energy_kwh" in entry:
            energy_kwh = float(entry["energy_kwh"])
            # Standard conversion: 1 MWh ≈ 0.5 tons CO2
            co2_tons = (energy_kwh / 1000) * 0.5
            return round(co2_tons, ProcessingConfig.DEFAULT_DECIMAL_PLACES)
        
        # Return 0 if no conversion possible
        return 0.0
    
    def _extract_timestamp(self, entry: Dict) -> str:
        """Extract and normalize timestamp"""
        timestamp_fields = ["timestamp", "datetime", "date", "time", "created_at"]
        
        for field in timestamp_fields:
            if field in entry:
                timestamp = entry[field]
                # Convert to ISO format if needed
                if isinstance(timestamp, datetime):
                    return timestamp.isoformat()
                elif isinstance(timestamp, str):
                    # Try to parse and reformat
                    try:
                        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        return dt.isoformat()
                    except ValueError:
                        return timestamp
        
        # Default to current timestamp
        return datetime.utcnow().isoformat()
    
    def clean(self, data: List[Dict]) -> List[Dict]:
        """
        Clean data by removing invalid or incomplete entries
        
        Args:
            data: List of data dictionaries
            
        Returns:
            List of cleaned data dictionaries
        """
        cleaned = []
        
        for entry in data:
            if self._is_valid_entry(entry):
                cleaned.append(entry)
            else:
                logger.debug(f"Skipping invalid entry: {entry.get('project_id', 'unknown')}")
        
        logger.info(f"Cleaned {len(cleaned)}/{len(data)} entries")
        return cleaned
    
    def _is_valid_entry(self, entry: Dict) -> bool:
        """Check if entry is valid"""
        # Check required fields
        for field in ProcessingConfig.REQUIRED_FIELDS:
            if field not in entry:
                return False
        
        # Check CO2 value
        co2_tons = entry.get("co2_tons", 0)
        if not isinstance(co2_tons, (int, float)):
            return False
        
        if co2_tons <= 0:
            return False
        
        if co2_tons < ProcessingConfig.MIN_CO2_TONS:
            return False
        
        if co2_tons > ProcessingConfig.MAX_CO2_TONS:
            return False
        
        # Check timestamp
        try:
            timestamp = entry.get("timestamp", "")
            datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return False
        
        return True
    
    def deduplicate(self, data: List[Dict]) -> List[Dict]:
        """
        Remove duplicate entries based on project_id and timestamp
        
        Args:
            data: List of data dictionaries
            
        Returns:
            List of deduplicated data dictionaries
        """
        seen = set()
        deduplicated = []
        
        for entry in data:
            key = (entry.get("project_id"), entry.get("timestamp"))
            if key not in seen:
                seen.add(key)
                deduplicated.append(entry)
        
        removed = len(data) - len(deduplicated)
        if removed > 0:
            logger.info(f"Removed {removed} duplicate entries")
        
        return deduplicated

