import enum
from datetime import datetime

from sqlalchemy import String, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AnniversaryType(str, enum.Enum):
    BIRTHDAY = "BIRTHDAY"
    WORK_ANNIVERSARY = "WORK_ANNIVERSARY"


class Anniversary(Base):
    __tablename__ = "anniversaries"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(
        Enum(AnniversaryType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
