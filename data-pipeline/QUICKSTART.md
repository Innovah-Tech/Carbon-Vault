# CarbonVault Data Pipeline - Quick Start Guide

## Installation

```bash
cd data-pipeline
pip install -r requirements.txt
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your API keys to `.env`:
```env
PLANET_LABS_API_KEY=your_key_here
SENTINEL2_API_KEY=your_key_here
# ... etc
```

## Basic Usage

### Run the Pipeline

```bash
# Fetch last 7 days of data
python -m pipeline.main

# Fetch last 30 days
python -m pipeline.main --days 30

# Fetch data for a specific location
python -m pipeline.main --lat 37.7749 --lon -122.4194 --radius 50000
```

### Using Python

```python
from pipeline.main import DataPipeline

# Create pipeline
pipeline = DataPipeline()

# Run pipeline
data = pipeline.run(days_back=7)

# Data is automatically saved to:
# - data/carbon_data.json
# - data/carbon_data.csv
# - data/carbon_data.db
```

## Data Sources

### Satellite Imagery
- **Planet Labs**: Commercial satellite imagery
- **Sentinel-2**: ESA's free satellite data
- **Landsat**: NASA's free satellite data

### IoT Sensors
- **Air Quality**: OpenAQ public API
- **Energy Meters**: Custom API integration
- **Emission Monitors**: Industrial monitoring systems

## Output Formats

The pipeline saves data in three formats:

1. **JSON**: `data/carbon_data.json`
   ```json
   {
     "metadata": {
       "timestamp": "2024-01-01T00:00:00",
       "record_count": 100
     },
     "data": [...]
   }
   ```

2. **CSV**: `data/carbon_data.csv`
   - Flattened format for easy analysis

3. **SQLite**: `data/carbon_data.db`
   - Queryable database with indexes

## Data Structure

Each record contains:
```python
{
    "project_id": "unique_project_id",
    "co2_tons": 100.5,
    "timestamp": "2024-01-01T00:00:00",
    "source": "planet_labs",
    "location": {
        "lat": 37.7749,
        "lon": -122.4194
    },
    "metadata": {...},
    "verification_status": "pending"
}
```

## Examples

See `example_usage.py` for more examples:

```bash
python example_usage.py
```

## Troubleshooting

### No data fetched
- Check API keys in `.env`
- Verify API endpoints are accessible
- Check logs in `logs/pipeline.log`

### Import errors
- Ensure you're in the `data-pipeline` directory
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Data validation errors
- Check data format matches expected structure
- Review logs for specific validation errors

