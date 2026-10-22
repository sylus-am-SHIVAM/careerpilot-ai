from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.resume import ResumeResponse
from app.services.resume_service import delete_resume, get_resume, upload_resume
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/v1/resume", tags=["Resume"])


@router.post("/upload", response_model=ResumeResponse)
def upload(
    file: UploadFile = File(...),
    target_role: str | None = Form(default=None, max_length=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return upload_resume(db, current_user, file, target_role or None)


@router.get("", response_model=ResumeResponse)
def read_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = get_resume(db, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="No resume uploaded")

    return resume


@router.delete("")
def remove_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    delete_resume(db, current_user.id)
    return {"message": "Resume deleted successfully"}
