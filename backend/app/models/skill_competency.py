from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.db.database import Base


class SkillCompetency(Base):

    __tablename__ = "skill_competencies"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    skill_id = Column(
        Integer,
        ForeignKey(
            "skills.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    name = Column(
        String(150),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    display_order = Column(
        Integer,
        nullable=False,
        default=0
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )

    concepts = relationship(
        "SkillConcept",
        back_populates="competency",
        cascade="all, delete-orphan"
    )