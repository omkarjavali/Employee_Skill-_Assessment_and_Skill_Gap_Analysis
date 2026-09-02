from fastapi import FastAPI
from sqlalchemy import text

import app.models

from app.db.database import engine
from app.routers.roles import router as roles_router
from app.routers.skills import router as skills_router
from app.routers.self_assessments import router as self_assessment_router
from app.routers import questions
from app.routers.assessments import router as assessment_router
from app.routers import evaluations
from app.services.adaptive_engine import calculate_next_level
from app.routers import skill_gap
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router


app = FastAPI(
    title="SkillLens API",
    description="AI-Powered Employee Skill Assessment Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

app.include_router(roles_router)
app.include_router(skills_router)
app.include_router(self_assessment_router)
app.include_router(questions.router)
app.include_router(assessment_router)
app.include_router(evaluations.router)
app.include_router(skill_gap.router)

app.include_router(admin_router)


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
