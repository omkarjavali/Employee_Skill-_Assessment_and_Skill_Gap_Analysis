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


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(
        BigInteger,
        primary_key=True,
        index=True
    )

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False
    )

    skill_id = Column(
        BigInteger,
        ForeignKey("skills.id"),
        nullable=False
    )

    starting_level = Column(
        Integer,
        nullable=False
    )

    current_level = Column(
        Integer,
        nullable=True
    )

    previous_level = Column(
        Integer,
        nullable=True
    )

    final_level = Column(
        Numeric,
        nullable=True
    )

    status = Column(
        String,
        nullable=False
    )

    started_at = Column(
        DateTime,
        nullable=True
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )