from sqlalchemy import (
    Column,
    BigInteger,
    Numeric,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.db.database import Base


class QuestionEvaluation(Base):
    __tablename__ = "question_evaluations"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    answer_id = Column(
        BigInteger,
        ForeignKey("answers.id"),
        nullable=False,
        unique=True
    )

    score = Column(
        Numeric,
        nullable=False
    )

    max_score = Column(
        Numeric,
        nullable=False
    )

    percentage = Column(
        Numeric,
        nullable=False
    )

    feedback = Column(
        Text,
        nullable=True
    )

    evaluated_at = Column(
        DateTime,
        server_default=func.now()
    )