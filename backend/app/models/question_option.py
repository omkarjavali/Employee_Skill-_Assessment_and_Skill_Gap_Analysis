from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.sql import func

from app.db.database import Base


class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    question_id = Column(
        BigInteger,
        ForeignKey(
            "questions.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    option_key = Column(
        String(10),
        nullable=False
    )

    option_text = Column(
        Text,
        nullable=False
    )

    is_correct = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "question_id",
            "option_key",
            name="uq_question_option_key"
        ),
    )