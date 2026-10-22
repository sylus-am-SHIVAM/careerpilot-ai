from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class RoadmapRequest(BaseModel):
    goal: str = Field(min_length=2, max_length=200)
    current_level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    duration_weeks: int = Field(default=12, ge=2, le=52)
    hours_per_week: int = Field(default=10, ge=1, le=60)


class RoadmapPhase(BaseModel):
    title: str
    weeks: str
    goals: list[str]
    skills: list[str]
    resources: list[str]
    project: str


class RoadmapContent(BaseModel):
    title: str
    summary: str
    phases: list[RoadmapPhase]
    final_outcome: str


class RoadmapResponse(BaseModel):
    id: int
    goal: str
    content: RoadmapContent
    created_at: datetime

    class Config:
        from_attributes = True


class SkillGapRequest(BaseModel):
    target_role: str = Field(min_length=2, max_length=200)
    current_skills: list[str] = Field(default_factory=list, max_length=50)


class MissingSkill(BaseModel):
    skill: str
    priority: Literal["high", "medium", "low"]
    reason: str
    how_to_learn: str


class SkillGapContent(BaseModel):
    readiness_score: int = Field(ge=0, le=100)
    summary: str
    matching_skills: list[str]
    missing_skills: list[MissingSkill]
    next_steps: list[str]


class SkillGapResponse(BaseModel):
    id: int
    target_role: str
    current_skills: list[str]
    content: SkillGapContent
    created_at: datetime

    class Config:
        from_attributes = True
