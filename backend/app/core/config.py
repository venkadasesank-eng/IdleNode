import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "IdleNode Campus Computing Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "idlenode-super-secure-production-ready-jwt-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./idlenode.db")
    
    # Campus Policy Defaults
    TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Kolkata")
    DAILY_CREDIT_ALLOWANCE: int = 100
    CREDIT_RESET_HOUR: int = 0  # Midnight 00:00
    CREDIT_RESET_MINUTE: int = 0
    MAX_CONCURRENT_SESSIONS_PER_STUDENT: int = 1
    MAX_SESSION_MINUTES: int = 240
    DISCONNECT_GRACE_PERIOD_SECONDS: int = 300  # 5 minutes to reconnect
    
    # Rates per hour in credits
    RATE_GENERAL_DESKTOP: int = 5
    RATE_DEV_CPU: int = 8
    RATE_DATA_SCIENCE: int = 12
    RATE_ML_GPU: int = 25
    RATE_SIMULATION: int = 18

    # Demo mode flag
    DEMO_MODE: bool = True

settings = Settings()
