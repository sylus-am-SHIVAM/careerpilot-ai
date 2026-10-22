from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ResumeSection(BaseModel):
    section: str
    feedback: str


class ResumeAnalysis(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    summary: str
    experience_level: Literal["student", "fresher", "junior", "mid", "senior"]
    extracted_skills: list[str]
    education: list[str]
    strengths: list[str]
    improvements: list[str]
    section_feedback: list[ResumeSection]
    ats_tips: list[str]
    suggested_roles: list[str]


class ResumeResponse(BaseModel):
    id: int
    filename: str
    target_role: str | None
    analysis: ResumeAnalysis
    uploaded_at: datetime

    class Config:
        from_attributes = True
