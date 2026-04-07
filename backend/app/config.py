from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Sync SQLAlchemy: sqlite for local dev; postgresql+psycopg2://user:pass@host:5432/db for PostgreSQL
    DATABASE_URL: str = "sqlite:///./community_portal.db"
    AZURE_AD_CLIENT_ID: str = ""
    AZURE_AD_CLIENT_SECRET: str = ""
    AZURE_AD_TENANT_ID: str = ""
    GRAPH_SENDER_EMAIL: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    DEV_MODE: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
