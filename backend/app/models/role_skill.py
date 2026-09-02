from sqlalchemy import BigInteger, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class RoleSkill(Base):
    __tablename__ = "role_skills"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    role_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("roles.id"),
        nullable=False
    )

    skill_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("skills.id"),
        nullable=False
    )

    expected_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    role = relationship(
        "Role",
        back_populates="role_skills"
    )

    skill = relationship(
        "Skill",
        back_populates="role_skills"
    )