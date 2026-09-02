from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class SkillGapAnalysis(Base):
    __tablename__ = "skill_gap_analyses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    assessment_id = Column(
        Integer,
        ForeignKey("assessments.id"),
        nullable=False,
        unique=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    skill_id = Column(
        Integer,
        ForeignKey("skills.id"),
        nullable=False
    )

    role_id = Column(
        Integer,
        ForeignKey("roles.id"),
        nullable=False
    )

    expected_level = Column(
        Integer,
        nullable=False
    )

    final_level = Column(
        Integer,
        nullable=False
    )

    gap = Column(
        Integer,
        nullable=False,
        default=0
    )

    surplus = Column(
        Integer,
        nullable=False,
        default=0
    )

    status = Column(
        String(50),
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    details = relationship(
        "SkillGapDetail",
        back_populates="analysis",
        cascade="all, delete-orphan"
    )