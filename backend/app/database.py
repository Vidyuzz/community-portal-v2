from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    **({
        "connect_args": {"check_same_thread": False}
    } if "sqlite" in settings.DATABASE_URL else {
        "pool_size": 20,
        "max_overflow": 10,
        "pool_pre_ping": True,
    }),
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass
