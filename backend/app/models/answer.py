from sqlalchemy import (
    Column,
    BigInteger,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.db.database import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    assessment_question_id = Column(
        BigInteger,
        ForeignKey("assessment_questions.id"),
        nullable=False
    )

    answer_text = Column(
        Text,
        nullable=False
    )

    submitted_at = Column(
        DateTime,
        server_default=func.now()
    )