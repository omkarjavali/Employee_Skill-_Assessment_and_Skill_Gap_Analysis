from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    Numeric,
    String,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.db.database import Base


class AssessmentAdaptiveDecision(Base):
    __tablename__ = "assessment_adaptive_decisions"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    assessment_id = Column(
        BigInteger,
        ForeignKey("assessments.id"),
        nullable=False
    )

    evaluation_id = Column(
        BigInteger,
        ForeignKey("question_evaluations.id"),
        nullable=False
    )

    current_level = Column(
        Integer,
        nullable=False
    )

    average_percentage = Column(
        Numeric,
        nullable=False
    )

    next_level = Column(
        Integer,
        nullable=False
    )

    decision = Column(
        String(30),
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )