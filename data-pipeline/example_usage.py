"""
Example usage of the CarbonVault Data Pipeline
"""
from pipeline.main import DataPipeline
from datetime import datetime, timedelta

# Example 1: Basic usage - fetch last 7 days of data
def example_basic():
    """Basic pipeline run"""
    pipeline = DataPipeline()
    data = pipeline.run(days_back=7)
    print(f"Fetched {len(data)} records")

# Example 2: Location-specific data
def example_location_specific():
    """Fetch data for a specific location"""
    pipeline = DataPipeline()
    
    # Example: San Francisco area
    location = {
        "lat": 37.7749,
        "lon": -122.4194,
        "radius": 50000  # 50km radius
    }
    
    data = pipeline.run(days_back=30, location=location)
    print(f"Fetched {len(data)} records for San Francisco area")

# Example 3: Load and process stored data
def example_load_data():
    """Load previously stored data"""
    from pipeline.storage.storage import DataStorage
    
    storage = DataStorage()
    
    # Load from JSON
    json_data = storage.load_json()
    print(f"Loaded {len(json_data)} records from JSON")
    
    # Load from SQLite
    sqlite_data = storage.load_sqlite(limit=100)
    print(f"Loaded {len(sqlite_data)} records from SQLite")

# Example 4: Manual data processing
def example_manual_processing():
    """Manually process data"""
    from pipeline.processors.normalizer import DataNormalizer
    from pipeline.storage.storage import DataStorage
    
    # Sample raw data
    raw_data = [
        {
            "project_id": "test_project_1",
            "co2_tons": 100.5,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "test_source"
        },
        {
            "project_id": "test_project_2",
            "co2_kg": 50000,  # Will be converted to tons
            "timestamp": datetime.utcnow().isoformat(),
            "source": "test_source"
        }
    ]
    
    # Normalize
    normalizer = DataNormalizer()
    normalized = normalizer.normalize(raw_data)
    
    # Clean
    cleaned = normalizer.clean(normalized)
    
    # Save
    storage = DataStorage()
    storage.save(cleaned)
    
    print(f"Processed and saved {len(cleaned)} records")

if __name__ == "__main__":
    print("Running example...")
    example_basic()

