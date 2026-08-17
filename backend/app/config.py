from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Sync SQLAlchemy: sqlite for local dev; postgresql+psycopg2://user:pass@host:5432/db for PostgreSQL
    DATABASE_URL: str = "sqlite:///./community_portal.db"

    # Connection pool (PostgreSQL only — ignored for sqlite).
    # Supabase's pooler in session mode (port 5432) allows 15 client connections
    # for the entire project, so the app's footprint has to stay well under that:
    # a rolling deploy briefly runs two instances AND `alembic upgrade head`, and
    # all of them draw from the same 15. Defaults give 5 per instance worst case.
    # Raise DB_POOL_SIZE only if you have moved to the transaction pooler (6543),
    # which allows far more clients.
    DB_POOL_SIZE: int = 3
    DB_MAX_OVERFLOW: int = 2
    DB_POOL_RECYCLE: int = 300  # seconds; the pooler drops idle connections
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
