from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ClientSubmission(Base):
    __tablename__ = "client_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    client_name: Mapped[str] = mapped_column(String, nullable=False)
    client_manager_name: Mapped[str] = mapped_column(String, nullable=False)
    client_manager_email: Mapped[str] = mapped_column(String, nullable=False)
    from_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    to_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    approval_token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    cs_status: Mapped[str] = mapped_column(String, default="Pending", nullable=False)
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rejection_note: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="client_submissions", lazy="selectin")
