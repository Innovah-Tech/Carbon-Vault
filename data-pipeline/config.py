"""
Configuration for CarbonVault Data Pipeline
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# API Configuration
class APIConfig:
    # Satellite Imagery APIs
    PLANET_LABS_API_URL = os.getenv("PLANET_LABS_API_URL", "https://api.planet.com/data/v1")
    PLANET_LABS_API_KEY = os.getenv("PLANET_LABS_API_KEY", "")
    
    SENTINEL2_API_URL = os.getenv("SENTINEL2_API_URL", "https://apihub.copernicus.eu/apihub")
    SENTINEL2_API_KEY = os.getenv("SENTINEL2_API_KEY", "")
    
    LANDSAT_API_URL = os.getenv("LANDSAT_API_URL", "https://landsatlook.usgs.gov/stac-server")
    LANDSAT_API_KEY = os.getenv("LANDSAT_API_KEY", "")
    
    # IoT Sensor APIs
    AIR_QUALITY_API_URL = os.getenv("AIR_QUALITY_API_URL", "https://api.openaq.org/v2")
    AIR_QUALITY_API_KEY = os.getenv("AIR_QUALITY_API_KEY", "")
    
    # Energy Meter APIs
    ENERGY_METER_API_URL = os.getenv("ENERGY_METER_API_URL", "")
    ENERGY_METER_API_KEY = os.getenv("ENERGY_METER_API_KEY", "")
    
    # Industrial Emission Monitors
    EMISSION_MONITOR_API_URL = os.getenv("EMISSION_MONITOR_API_URL", "")
    EMISSION_MONITOR_API_KEY = os.getenv("EMISSION_MONITOR_API_KEY", "")

# Data Processing Configuration
class ProcessingConfig:
    # Units
    CO2_UNIT = "tons"  # Standard unit for CO2
    DEFAULT_DECIMAL_PLACES = 2
    
    # Validation thresholds
    MIN_CO2_TONS = 0.01  # Minimum valid CO2 amount
    MAX_CO2_TONS = 1000000  # Maximum valid CO2 amount
    
    # Data quality
    REQUIRED_FIELDS = ["project_id", "co2_tons", "timestamp"]
    OPTIONAL_FIELDS = ["location", "source", "verification_status", "metadata"]

# Storage Configuration
class StorageConfig:
    JSON_OUTPUT = DATA_DIR / "carbon_data.json"
    CSV_OUTPUT = DATA_DIR / "carbon_data.csv"
    SQLITE_DB = DATA_DIR / "carbon_data.db"
    
    # Backup settings
    ENABLE_BACKUP = True
    BACKUP_DIR = DATA_DIR / "backups"
    MAX_BACKUPS = 10

# Pipeline Configuration
class PipelineConfig:
    # Retry settings
    MAX_RETRIES = 3
    RETRY_DELAY = 5  # seconds
    
    # Rate limiting
    REQUESTS_PER_SECOND = 10
    
    # Batch processing
    BATCH_SIZE = 100
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = LOGS_DIR / "pipeline.log"

