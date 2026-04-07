import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, Float, ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DayType(str, enum.Enum):
    Working = "Working"
    Leave = "Leave"
    Holiday = "Holiday"
    HalfDay = "HalfDay"
    CompOff = "CompOff"


class ApprovalStatus(str, enum.Enum):
    Pending = "Pending"
    Approved = "Approved"
    Denied = "Denied"


class Timesheet(Base):
    __tablename__ = "timesheets"

    timesheet_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    client_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    project_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    work_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    type_of_day: Mapped[str] = mapped_column(
        Enum(DayType, values_callable=lambda x: [e.value for e in x]),
        default=DayType.Working.value,
        nullable=False,
    )
    hours_worked: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    comments: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(ApprovalStatus, values_callable=lambda x: [e.value for e in x]),
        default=ApprovalStatus.Pending.value,
        nullable=False,
    )
    manager_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="timesheets", lazy="selectin")
