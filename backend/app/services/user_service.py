from app.schemas.login import LoginRequest
from app.utils.security import verify_password, create_access_token, hash_password

# from app.utils.security import hash_password 
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
# def create_user(db: Session, user: UserCreate):
#     db_user = User(
#         full_name=user.full_name,
#         email=user.email,
#         password=user.password
#     )

#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)


    # return db_user
def create_user(db: Session, user: UserCreate):
    db_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user
def get_users(db: Session):
    return db.query(User).all()


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user_id: int, user: UserCreate):
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user:
        db_user.full_name = user.full_name
        db_user.email = user.email
        db_user.password = user.password

        db.commit()
        db.refresh(db_user)

    return db_user


def delete_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user:
        db.delete(db_user)
        db.commit()

    return db_user

def login_user(db, login_data: LoginRequest):
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user:
        return None

    if not verify_password(login_data.password, user.password):
        return None

    token = create_access_token({"sub": user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }