"""
Main Data Pipeline Orchestrator
Coordinates data fetching, processing, and storage
"""
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict
from loguru import logger
import sys
from pathlib import Path

# Add parent directory to path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

from config import PipelineConfig
from pipeline.sources.satellite import get_satellite_sources
from pipeline.sources.iot_sensors import get_iot_sources
from pipeline.processors.normalizer import DataNormalizer
from pipeline.storage.storage import DataStorage


class DataPipeline:
    """Main data pipeline orchestrator"""
    
    def __init__(self):
        self.config = PipelineConfig
        self.normalizer = DataNormalizer()
        self.storage = DataStorage()
        
        # Setup logging
        logger.add(
            self.config.LOG_FILE,
            rotation="10 MB",
            retention="7 days",
            level=self.config.LOG_LEVEL
        )
    
    def run(self, days_back: int = 7, location: Dict = None):
        """
        Run the complete data pipeline
        
        Args:
            days_back: Number of days to fetch data for
            location: Optional location filter (lat, lon, radius)
        """
        logger.info("Starting CarbonVault data pipeline")
        
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days_back)
            
            date_range = {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
            
            # Fetch data from all sources
            all_data = []
            
            # Fetch from satellite sources
            logger.info("Fetching satellite data...")
            satellite_sources = get_satellite_sources()
            for source in satellite_sources:
                try:
                    raw_data = source.fetch_data(
                        start_date=date_range["start"],
                        end_date=date_range["end"],
                        location=location
                    )
                    normalized = source.normalize_data(raw_data)
                    all_data.extend(normalized)
                    logger.info(f"Fetched {len(normalized)} records from {source.__class__.__name__}")
                except Exception as e:
                    logger.error(f"Error fetching from {source.__class__.__name__}: {e}")
                    continue
            
            # Fetch from IoT sensor sources
            logger.info("Fetching IoT sensor data...")
            iot_sources = get_iot_sources()
            for source in iot_sources:
                try:
                    raw_data = source.fetch_data(location=location, date_range=date_range)
                    normalized = source.normalize_data(raw_data)
                    all_data.extend(normalized)
                    logger.info(f"Fetched {len(normalized)} records from {source.__class__.__name__}")
                except Exception as e:
                    logger.error(f"Error fetching from {source.__class__.__name__}: {e}")
                    continue
            
            if not all_data:
                logger.warning("No data fetched from any source")
                return
            
            logger.info(f"Total raw records fetched: {len(all_data)}")
            
            # Normalize data
            logger.info("Normalizing data...")
            normalized_data = self.normalizer.normalize(all_data)
            
            # Clean data
            logger.info("Cleaning data...")
            cleaned_data = self.normalizer.clean(normalized_data)
            
            # Deduplicate data
            logger.info("Deduplicating data...")
            final_data = self.normalizer.deduplicate(cleaned_data)
            
            # Save data
            logger.info("Saving data...")
            self.storage.save(final_data)
            
            logger.info(f"Pipeline completed successfully. Processed {len(final_data)} records")
            
            return final_data
            
        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            raise


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="CarbonVault Data Pipeline")
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Number of days to fetch data for (default: 7)"
    )
    parser.add_argument(
        "--lat",
        type=float,
        help="Latitude for location filter"
    )
    parser.add_argument(
        "--lon",
        type=float,
        help="Longitude for location filter"
    )
    parser.add_argument(
        "--radius",
        type=int,
        default=10000,
        help="Radius in meters for location filter (default: 10000)"
    )
    
    args = parser.parse_args()
    
    location = None
    if args.lat and args.lon:
        location = {
            "lat": args.lat,
            "lon": args.lon,
            "radius": args.radius
        }
    
    pipeline = DataPipeline()
    pipeline.run(days_back=args.days, location=location)


if __name__ == "__main__":
    main()

