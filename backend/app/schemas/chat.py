from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    id: int
    message: str
    response: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatReply(ChatResponse):
    sources: list[str] = []
