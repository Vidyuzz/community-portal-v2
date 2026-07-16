from pydantic import field_validator, model_validator
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
    # "development" | "production". In production we refuse to run on SQLite so a missing
    # DATABASE_URL fails loudly instead of silently using an ephemeral file that is wiped on
    # every redeploy (the original cause of the "Team/Timesheet show nothing" outage).
    ENVIRONMENT: str = "development"

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_db_url(cls, v: str) -> str:
        """Managed Postgres providers (Render, Heroku, etc.) hand out `postgres://` or
        `postgresql://` URLs. SQLAlchemy 2.x rejects the bare `postgres://` scheme and
        defaults `postgresql://` to psycopg2 — normalize both to the explicit driver so the
        same value works whether it comes from a provider or is set by hand."""
        if v.startswith("postgres://"):
            return "postgresql+psycopg2://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            return "postgresql+psycopg2://" + v[len("postgresql://"):]
        return v

    @model_validator(mode="after")
    def _guard_sqlite_in_production(self):
        if self.ENVIRONMENT.lower() == "production" and self.DATABASE_URL.startswith("sqlite"):
            raise ValueError(
                "DATABASE_URL must point at PostgreSQL when ENVIRONMENT=production. "
                "Refusing to start on ephemeral SQLite (data would be lost on every redeploy). "
                "Set DATABASE_URL to your Postgres connection string on the host."
            )
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
