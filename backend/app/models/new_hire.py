from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class NewHire(Base):
    __tablename__ = "new_hires"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    department: Mapped[str] = mapped_column(String, nullable=False)
    joinedAt: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    avatarUrl: Mapped[Optional[str]] = mapped_column(String, nullable=True)
