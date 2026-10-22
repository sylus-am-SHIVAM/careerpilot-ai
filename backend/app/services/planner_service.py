from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.career_plan import Roadmap, SkillGapReport
from app.models.user import User
from app.schemas.career_plan import (
    RoadmapContent,
    RoadmapRequest,
    SkillGapContent,
    SkillGapRequest
)
from app.services.mentor_service import get_user_career_profile, retrieve_context
from app.utils.llm import generate_json

PLANNER_PROMPT = """You are CareerPilot AI, an expert career planner for students in India.
Produce realistic, specific, beginner-friendly plans. Prefer free, well-known resources
(official docs, NPTEL, freeCodeCamp, CS50, Kaggle, YouTube channels) and name them concretely.
Never invent statistics, salaries or exam dates. Respond only with JSON matching the schema."""


def build_background(db: Session, user: User, query: str):
    background = []

    profile = get_user_career_profile(db, user)
    if profile:
        background.append(f"Student's career assessment results:\n{profile}")

    context, _ = retrieve_context(query)
    if context:
        background.append(f"Reference material from the CareerPilot knowledge base:\n{context}")

    return "\n\n".join(background)


def generate_roadmap(db: Session, user: User, request: RoadmapRequest):
    prompt = f"""Create a learning roadmap.
Goal: {request.goal}
Current level: {request.current_level}
Total duration: {request.duration_weeks} weeks
Time available: {request.hours_per_week} hours per week

Split the duration into 3 to 6 phases. Each phase must have a week range like "Weeks 1-3",
concrete goals, skills, named resources and one hands-on project.

{build_background(db, user, request.goal)}"""

    content = generate_json(PLANNER_PROMPT, prompt, RoadmapContent)

    roadmap = Roadmap(user_id=user.id, goal=request.goal, content=content)
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    return roadmap


def get_roadmaps(db: Session, user_id: int):
    return (
        db.query(Roadmap)
        .filter(Roadmap.user_id == user_id)
        .order_by(Roadmap.created_at.desc())
        .all()
    )


def get_roadmap(db: Session, roadmap_id: int, user_id: int):
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.id == roadmap_id, Roadmap.user_id == user_id)
        .first()
    )

    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    return roadmap


def analyze_skill_gap(db: Session, user: User, request: SkillGapRequest):
    skills = [s.strip() for s in request.current_skills if s.strip()]

    prompt = f"""Analyse the skill gap for this student.
Target role: {request.target_role}
Current skills: {", ".join(skills) if skills else "none listed"}

readiness_score is 0-100 for how ready the student is for an entry-level {request.target_role} role.
List matching skills the student already has that matter for the role, and the most important
missing skills (maximum 8) with priority, reason and how to learn each one.

{build_background(db, user, request.target_role)}"""

    content = generate_json(PLANNER_PROMPT, prompt, SkillGapContent)

    report = SkillGapReport(
        user_id=user.id,
        target_role=request.target_role,
        current_skills=skills,
        content=content
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def get_skill_gap_reports(db: Session, user_id: int):
    return (
        db.query(SkillGapReport)
        .filter(SkillGapReport.user_id == user_id)
        .order_by(SkillGapReport.created_at.desc())
        .all()
    )
