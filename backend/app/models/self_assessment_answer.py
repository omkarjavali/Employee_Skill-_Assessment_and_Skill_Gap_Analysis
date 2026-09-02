from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Integer,
    ForeignKey,
    DateTime,
    func
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class SelfAssessmentAnswer(Base):
    __tablename__ = "self_assessment_answers"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    self_assessment_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "self_assessments.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    skill_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("skills.id"),
        nullable=False
    )

    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )