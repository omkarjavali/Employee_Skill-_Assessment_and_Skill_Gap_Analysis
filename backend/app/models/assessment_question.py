from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.db.database import Base


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

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

    question_id = Column(
        BigInteger,
        ForeignKey("questions.id"),
        nullable=False
    )

    sequence_number = Column(
        Integer,
        nullable=False
    )

    difficulty_level = Column(
        Integer,
        nullable=False
    )

    presented_at = Column(
        DateTime,
        server_default=func.now()
    )