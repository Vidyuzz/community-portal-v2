from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    **({
        "connect_args": {"check_same_thread": False}
    } if "sqlite" in settings.DATABASE_URL else {
        # Sized against Supabase session mode's 15-client project limit — see the
        # note in config.py. The old 20 + 10 overflow could claim 30 from a single
        # instance, which left nothing for `alembic upgrade head` on deploy:
        # EMAXCONNSESSION, exit 1, and Render kept serving the previous build.
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_pre_ping": True,
    }),
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass
