from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class SkillGapConceptResponse(BaseModel):

    id: int

    name: str

    description: Optional[str] = None

    percentage: float

    classification: str

    rubric_count: int


class SkillGapCardResponse(BaseModel):

    id: int

    title: str

    description: Optional[str] = None

    percentage: float

    classification: str

    concepts: List[
        SkillGapConceptResponse
    ] = Field(
        default_factory=list
    )


class SkillGapEvidenceResponse(BaseModel):

    rubric_id: int

    criterion: str

    score: float

    max_score: float

    percentage: float

    classification: str

    feedback: Optional[str] = None

    concept_id: int

    concept_name: str

    competency_id: int

    competency_name: str


class SkillGapAnalysisResponse(BaseModel):

    id: int

    assessment_id: int

    user_id: int

    skill_id: int

    role_id: int

    skill_name: str
    role_name: str

    expected_level: int
    final_level: int

    gap: int
    surplus: int

    status: str

    strengths: List[
        SkillGapCardResponse
    ]

    development_areas: List[
        SkillGapCardResponse
    ]

    gaps: List[
        SkillGapCardResponse
    ]

    evidence: List[
        SkillGapEvidenceResponse
    ]

    created_at: datetime