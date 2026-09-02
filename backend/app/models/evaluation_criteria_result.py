from sqlalchemy import (
    Column,
    BigInteger,
    Numeric,
    Text,
    ForeignKey
)

from app.db.database import Base


class EvaluationCriteriaResult(Base):
    __tablename__ = "evaluation_criteria_results"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    evaluation_id = Column(
        BigInteger,
        ForeignKey("question_evaluations.id"),
        nullable=False
    )

    rubric_id = Column(
        BigInteger,
        ForeignKey("question_rubrics.id"),
        nullable=False
    )

    score = Column(
        Numeric,
        nullable=False
    )

    max_score = Column(
        Numeric,
        nullable=False
    )

    feedback = Column(
        Text,
        nullable=True
    )