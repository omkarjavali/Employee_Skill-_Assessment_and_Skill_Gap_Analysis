from datetime import datetime

from sqlalchemy import (
    BigInteger,
    String,
    ForeignKey,
    DateTime,
    func
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class SelfAssessment(Base):
    __tablename__ = "self_assessments"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    role_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("roles.id"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="IN_PROGRESS"
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )