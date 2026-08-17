import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    azureOid: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.EMPLOYEE.value,
        nullable=False,
    )
    managerId: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )
    leave_balance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    employeeId: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    specialization: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    # These collections are lazy on purpose. get_current_user loads a User on
    # every authenticated request; eager-loading them made each request drag in
    # the user's entire timesheet, submission and notification history — four
    # queries to read one column.
    manager = relationship("User", remote_side=[id], foreign_keys=[managerId])
    timesheets = relationship("Timesheet", back_populates="user")
    client_submissions = relationship("ClientSubmission", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
