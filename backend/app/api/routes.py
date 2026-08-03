
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import create_user

# router = APIRouter()
router = APIRouter(prefix="/api/v1", tags=["CareerPilot API"])

@router.get("/")
def root():
    return {
        "message": "Welcome to CareerPilot AI 🚀"
    }

@router.get("/health")
def health():
    return {
        "status": "healthy"
    }
@router.post("/users", response_model=UserResponse)
def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    return create_user(db, user)
