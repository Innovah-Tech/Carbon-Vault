# CarbonVault Data Pipeline

Off-chain data pipeline for collecting, processing, and storing real-world carbon emission and reduction data.

## Overview

The data pipeline collects verified emission and carbon reduction data from multiple sources:
- **Satellite Imagery**: Planet Labs, Sentinel-2 (ESA), Landsat (NASA)
- **IoT Sensors**: Public air quality sensors, smart energy meters, industrial emission monitors

## Architecture

```
Data Sources → Data Fetching → Normalization → Cleaning → Storage → On-Chain Integration
```

## Features

- Multi-source data collection
- Data normalization and validation
- Storage in multiple formats (JSON, CSV, SQLite)
- Configurable data sources
- Error handling and retry logic
- Data quality checks

## Setup

### Prerequisites

```bash
pip install -r requirements.txt
```

### Configuration

1. Copy `.env.example` to `.env`
2. Add your API keys for data sources
3. Configure data source endpoints

## Usage

```bash
# Run the data pipeline
python pipeline/main.py

# Run specific data source fetcher
python pipeline/sources/satellite.py

# Normalize and clean data
python pipeline/processors/normalizer.py
```

## Data Flow

1. **Fetch**: Collect data from various sources
2. **Normalize**: Standardize units and formats
3. **Clean**: Remove invalid or incomplete entries
4. **Store**: Save to JSON, CSV, or SQLite
5. **Validate**: Quality checks before on-chain integration

## Output Formats

- **JSON**: `data/carbon_data.json`
- **CSV**: `data/carbon_data.csv`
- **SQLite**: `data/carbon_data.db`

