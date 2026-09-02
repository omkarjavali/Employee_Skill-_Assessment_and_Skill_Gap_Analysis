from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.db.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    skill_id = Column(
        BigInteger,
        ForeignKey("skills.id"),
        nullable=False
    )

    level = Column(
        Integer,
        nullable=False
    )

    question_type = Column(
        String(50),
        nullable=False
    )

    question_text = Column(
        Text,
        nullable=False
    )

    time_limit_seconds = Column(
        Integer,
        nullable=True
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )