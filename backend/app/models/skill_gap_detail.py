from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Text,
    ForeignKey
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class SkillGapDetail(Base):
    __tablename__ = "skill_gap_details"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    skill_gap_analysis_id = Column(
        Integer,
        ForeignKey(
            "skill_gap_analyses.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    rubric_id = Column(
        Integer,
        nullable=False
    )

    score = Column(
        Float,
        nullable=False
    )

    max_score = Column(
        Float,
        nullable=False
    )

    percentage = Column(
        Float,
        nullable=False
    )

    classification = Column(
        String(50),
        nullable=False
    )

    feedback = Column(
        Text,
        nullable=True
    )

    analysis = relationship(
        "SkillGapAnalysis",
        back_populates="details"
    )