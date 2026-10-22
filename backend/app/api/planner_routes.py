from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.career_plan import (
    RoadmapRequest,
    RoadmapResponse,
    SkillGapRequest,
    SkillGapResponse
)
from app.services.planner_service import (
    analyze_skill_gap,
    generate_roadmap,
    get_roadmap,
    get_roadmaps,
    get_skill_gap_reports
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/v1", tags=["Roadmap & Skill Gap"])


@router.post("/roadmap/generate", response_model=RoadmapResponse)
def create_roadmap(
    request: RoadmapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return generate_roadmap(db, current_user, request)


@router.get("/roadmap", response_model=list[RoadmapResponse])
def list_roadmaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_roadmaps(db, current_user.id)


@router.get("/roadmap/{roadmap_id}", response_model=RoadmapResponse)
def read_roadmap(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_roadmap(db, roadmap_id, current_user.id)


@router.post("/skill-gap", response_model=SkillGapResponse)
def create_skill_gap(
    request: SkillGapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return analyze_skill_gap(db, current_user, request)


@router.get("/skill-gap", response_model=list[SkillGapResponse])
def list_skill_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_skill_gap_reports(db, current_user.id)
