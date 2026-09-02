from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context

from app.db.database import Base
from app.core.config import settings


# Import all models so SQLAlchemy registers their tables

from app.models.user import User
from app.models.skill import Skill
from app.models.role import Role
from app.models.role_skill import RoleSkill
from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.answer import Answer
from app.models.evaluation import EvaluationResult
from app.models.evaluation_criteria_result import EvaluationCriteriaResult
from app.models.skill_gap_analysis import SkillGapAnalysis
from app.models.skill_gap_detail import SkillGapDetail


# Alembic Config object
config = context.config


# Configure logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# SQLAlchemy metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in offline mode."""

    url = settings.DATABASE_URL

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in online mode."""

    connectable = create_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()