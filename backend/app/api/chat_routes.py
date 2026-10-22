from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.chat import ChatReply, ChatRequest, ChatResponse
from app.services.mentor_service import chat_with_mentor, get_chat_history
from app.utils.security import get_current_user

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["AI Mentor"]
)


@router.post("", response_model=ChatReply)
def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat, sources = chat_with_mentor(db, current_user, request.message)

    return ChatReply(
        id=chat.id,
        message=chat.message,
        response=chat.response,
        created_at=chat.created_at,
        sources=sources
    )


@router.get("/history", response_model=list[ChatResponse])
def chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_chat_history(db, current_user.id)
