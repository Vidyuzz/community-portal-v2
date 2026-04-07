from datetime import datetime

from sqlalchemy import Integer, String, DateTime, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MonthLock(Base):
    __tablename__ = "month_locks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    locked_by: Mapped[str] = mapped_column(String, nullable=False)
    locked_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )

    __table_args__ = (UniqueConstraint("year", "month", name="uq_year_month"),)
