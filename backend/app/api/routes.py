from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.login import LoginRequest
from app.utils.security import get_current_user
# from app.services.user_service import login_user
from fastapi import HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.user import UserCreate, UserResponse
# from app.services.user_service import create_user
# from app.services.user_service import (
#     create_user,
#     get_users,
#     get_user,
#     update_user,
#     delete_user
# )
from app.services.user_service import (
    create_user,
    get_users,
    get_user,
    update_user,
    delete_user,
    login_user,
)


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



# @router.get("/users", response_model=list[UserResponse])
# def get_all_users(
#     db: Session = Depends(get_db)
# ):
#     return get_users(db)
@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_users(db)


@router.get("/users/{user_id}", response_model=UserResponse)
def get_single_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_user(db, user_id)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_existing_user(
    user_id: int,
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return update_user(db, user_id, user)


@router.delete("/users/{user_id}")
def delete_existing_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    delete_user(db, user_id)
    return {"message": "User deleted successfully"}

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    login_data = LoginRequest(
        email=form_data.username,
        password=form_data.password
    )

    result = login_user(db, login_data)

    if not result:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return result

