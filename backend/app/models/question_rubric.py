from sqlalchemy import (
    Column,
    Integer,
    Float,
    Text,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.db.database import Base


class QuestionRubric(Base):

    __tablename__ = "question_rubrics"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    question_id = Column(
        Integer,
        ForeignKey(
            "questions.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    criterion = Column(
        Text,
        nullable=False
    )

    weight = Column(
        Float,
        nullable=False
    )

    concept_id = Column(
        Integer,
        ForeignKey(
            "skill_concepts.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    concept = relationship(
        "SkillConcept",
        back_populates="rubrics"
    )