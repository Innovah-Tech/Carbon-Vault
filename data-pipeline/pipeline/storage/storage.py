"""
Data Storage Module
Supports JSON, CSV, and SQLite storage
"""
import json
import csv
import sqlite3
from pathlib import Path
from typing import List, Dict
from datetime import datetime
from loguru import logger
import shutil

from config import StorageConfig


class DataStorage:
    """Unified data storage interface"""
    
    def __init__(self):
        self.config = StorageConfig
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure storage directories exist"""
        self.config.JSON_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        self.config.CSV_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        self.config.SQLITE_DB.parent.mkdir(parents=True, exist_ok=True)
        
        if self.config.ENABLE_BACKUP:
            self.config.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    def save(self, data: List[Dict], formats: List[str] = None):
        """
        Save data in specified formats
        
        Args:
            data: List of data dictionaries
            formats: List of formats to save (json, csv, sqlite). If None, saves all.
        """
        if formats is None:
            formats = ["json", "csv", "sqlite"]
        
        # Create backup before saving
        if self.config.ENABLE_BACKUP:
            self._create_backup()
        
        if "json" in formats:
            self._save_json(data)
        
        if "csv" in formats:
            self._save_csv(data)
        
        if "sqlite" in formats:
            self._save_sqlite(data)
        
        logger.info(f"Saved {len(data)} records in formats: {formats}")
    
    def _save_json(self, data: List[Dict]):
        """Save data as JSON"""
        try:
            output = {
                "metadata": {
                    "timestamp": datetime.utcnow().isoformat(),
                    "record_count": len(data),
                    "version": "1.0"
                },
                "data": data
            }
            
            with open(self.config.JSON_OUTPUT, "w") as f:
                json.dump(output, f, indent=4, default=str)
            
            logger.info(f"Saved {len(data)} records to JSON: {self.config.JSON_OUTPUT}")
        except Exception as e:
            logger.error(f"Error saving JSON: {e}")
            raise
    
    def _save_csv(self, data: List[Dict]):
        """Save data as CSV"""
        try:
            if not data:
                logger.warning("No data to save to CSV")
                return
            
            # Get all unique keys from all records
            fieldnames = set()
            for record in data:
                fieldnames.update(record.keys())
            
            # Flatten nested dictionaries for CSV
            flattened_data = []
            for record in data:
                flattened = self._flatten_dict(record)
                flattened_data.append(flattened)
                fieldnames.update(flattened.keys())
            
            with open(self.config.CSV_OUTPUT, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=sorted(fieldnames))
                writer.writeheader()
                writer.writerows(flattened_data)
            
            logger.info(f"Saved {len(data)} records to CSV: {self.config.CSV_OUTPUT}")
        except Exception as e:
            logger.error(f"Error saving CSV: {e}")
            raise
    
    def _flatten_dict(self, d: Dict, parent_key: str = "", sep: str = "_") -> Dict:
        """Flatten nested dictionary"""
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(self._flatten_dict(v, new_key, sep=sep).items())
            elif isinstance(v, list):
                # Convert list to string representation
                items.append((new_key, json.dumps(v)))
            else:
                items.append((new_key, v))
        return dict(items)
    
    def _save_sqlite(self, data: List[Dict]):
        """Save data to SQLite database"""
        try:
            conn = sqlite3.connect(self.config.SQLITE_DB)
            cursor = conn.cursor()
            
            # Create table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS carbon_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id TEXT NOT NULL,
                    co2_tons REAL NOT NULL,
                    timestamp TEXT NOT NULL,
                    source TEXT NOT NULL,
                    location TEXT,
                    metadata TEXT,
                    verification_status TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(project_id, timestamp)
                )
            """)
            
            # Create index for faster queries
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_project_id ON carbon_data(project_id)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_timestamp ON carbon_data(timestamp)
            """)
            
            # Insert data
            for record in data:
                cursor.execute("""
                    INSERT OR REPLACE INTO carbon_data 
                    (project_id, co2_tons, timestamp, source, location, metadata, verification_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    record.get("project_id"),
                    record.get("co2_tons"),
                    record.get("timestamp"),
                    record.get("source"),
                    json.dumps(record.get("location", {})),
                    json.dumps(record.get("metadata", {})),
                    record.get("verification_status", "pending")
                ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Saved {len(data)} records to SQLite: {self.config.SQLITE_DB}")
        except Exception as e:
            logger.error(f"Error saving to SQLite: {e}")
            raise
    
    def _create_backup(self):
        """Create backup of existing data files"""
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            
            # Backup JSON
            if self.config.JSON_OUTPUT.exists():
                backup_path = self.config.BACKUP_DIR / f"carbon_data_{timestamp}.json"
                shutil.copy2(self.config.JSON_OUTPUT, backup_path)
            
            # Backup CSV
            if self.config.CSV_OUTPUT.exists():
                backup_path = self.config.BACKUP_DIR / f"carbon_data_{timestamp}.csv"
                shutil.copy2(self.config.CSV_OUTPUT, backup_path)
            
            # Backup SQLite
            if self.config.SQLITE_DB.exists():
                backup_path = self.config.BACKUP_DIR / f"carbon_data_{timestamp}.db"
                shutil.copy2(self.config.SQLITE_DB, backup_path)
            
            # Clean up old backups
            self._cleanup_old_backups()
            
        except Exception as e:
            logger.warning(f"Error creating backup: {e}")
    
    def _cleanup_old_backups(self):
        """Remove old backup files, keeping only the most recent ones"""
        try:
            backups = sorted(self.config.BACKUP_DIR.glob("*"), key=lambda p: p.stat().st_mtime, reverse=True)
            
            if len(backups) > self.config.MAX_BACKUPS:
                for old_backup in backups[self.config.MAX_BACKUPS:]:
                    old_backup.unlink()
                    logger.debug(f"Removed old backup: {old_backup}")
        except Exception as e:
            logger.warning(f"Error cleaning up backups: {e}")
    
    def load_json(self) -> List[Dict]:
        """Load data from JSON file"""
        try:
            with open(self.config.JSON_OUTPUT, "r") as f:
                data = json.load(f)
                return data.get("data", [])
        except FileNotFoundError:
            logger.warning(f"JSON file not found: {self.config.JSON_OUTPUT}")
            return []
        except Exception as e:
            logger.error(f"Error loading JSON: {e}")
            return []
    
    def load_sqlite(self, limit: int = None) -> List[Dict]:
        """Load data from SQLite database"""
        try:
            conn = sqlite3.connect(self.config.SQLITE_DB)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = "SELECT * FROM carbon_data ORDER BY timestamp DESC"
            if limit:
                query += f" LIMIT {limit}"
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            data = []
            for row in rows:
                record = {
                    "project_id": row["project_id"],
                    "co2_tons": row["co2_tons"],
                    "timestamp": row["timestamp"],
                    "source": row["source"],
                    "location": json.loads(row["location"]) if row["location"] else {},
                    "metadata": json.loads(row["metadata"]) if row["metadata"] else {},
                    "verification_status": row["verification_status"]
                }
                data.append(record)
            
            conn.close()
            return data
        except Exception as e:
            logger.error(f"Error loading from SQLite: {e}")
            return []

