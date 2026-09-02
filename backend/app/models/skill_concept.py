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


class SkillConcept(Base):

    __tablename__ = "skill_concepts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    competency_id = Column(
        Integer,
        ForeignKey(
            "skill_competencies.id",
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

    competency = relationship(
        "SkillCompetency",
        back_populates="concepts"
    )

    rubrics = relationship(
        "QuestionRubric",
        back_populates="concept"
    )