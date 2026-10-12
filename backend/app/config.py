import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Smart City Management System"
    API_V1_STR: str = ""
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smart_city_super_secret_jwt_key_2026_x89f")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database Settings (MySQL primary, SQLite fallback)
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "smart_city_db")

    @property
    def DATABASE_URL(self) -> str:
        # Check explicit DATABASE_URL env var
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")
        # Check if MySQL password or host specified, otherwise default fallback SQLite
        if self.MYSQL_PASSWORD:
            return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        # Local demo SQLite fallback for easy setup
        sqlite_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "smart_city.db")
        return f"sqlite:///{sqlite_path}"

    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
