"""
SIMREKAP Database Manager
Handles SQLite database connections and operations.
"""
import sqlite3
from server.core.config import (
    DB_PATH,
    DB_TIMEOUT_SECONDS,
    DB_PRAGMA_JOURNAL_MODE,
    DB_PRAGMA_SYNCHRONOUS,
    DB_PRAGMA_TEMP_STORE,
    DB_PRAGMA_FOREIGN_KEYS,
)


class DatabaseManager:
    """Singleton database connection manager."""
    
    _instance = None
    _connection = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_connection(self):
        """Get or create database connection."""
        if self._connection is None:
            self._connection = sqlite3.connect(str(DB_PATH), timeout=DB_TIMEOUT_SECONDS)
            self._connection.row_factory = sqlite3.Row
            self._configure_connection()
        return self._connection
    
    def _configure_connection(self):
        """Configure connection with pragmas."""
        conn = self._connection
        conn.execute(f"PRAGMA journal_mode = {DB_PRAGMA_JOURNAL_MODE}")
        conn.execute(f"PRAGMA synchronous = {DB_PRAGMA_SYNCHRONOUS}")
        conn.execute(f"PRAGMA temp_store = {DB_PRAGMA_TEMP_STORE}")
        conn.execute(f"PRAGMA foreign_keys = {DB_PRAGMA_FOREIGN_KEYS}")
    
    def execute(self, sql, params=()):
        """Execute SQL statement."""
        conn = self.get_connection()
        return conn.execute(sql, params)
    
    def commit(self):
        """Commit transaction."""
        self._connection.commit()
    
    def close(self):
        """Close database connection."""
        if self._connection:
            self._connection.close()
            self._connection = None


# Global instance
db_manager = DatabaseManager()


def get_db():
    """Get database connection."""
    return db_manager.get_connection()


def execute(sql, params=()):
    """Execute SQL (convenience function)."""
    return db_manager.execute(sql, params)


def commit():
    """Commit transaction (convenience function)."""
    db_manager.commit()


def close_db():
    """Close database (convenience function)."""
    db_manager.close()
