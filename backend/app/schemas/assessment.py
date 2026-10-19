from pydantic import BaseModel
from typing import Optional


class AssessmentBase(BaseModel):
    title: str
    description: Optional[str] = None


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentResponse(AssessmentBase):
    id: int

    class Config:
        from_attributes = True
class OptionBase(BaseModel):
    option_text: str


class OptionCreate(OptionBase):
    pass


class OptionResponse(OptionBase):
    id: int

    class Config:
        from_attributes = True


class QuestionBase(BaseModel):
    question_text: str


class QuestionCreate(QuestionBase):
    options: list[OptionCreate]


class QuestionResponse(QuestionBase):
    id: int
    assessment_id: int
    options: list[OptionResponse]

    class Config:
        from_attributes = True


class UserAnswerCreate(BaseModel):
    question_id: int
    option_id: int


class UserAnswerResponse(BaseModel):
    id: int
    user_id: int
    question_id: int
    option_id: int

    class Config:
        from_attributes = True
        

class AssessmentResultResponse(BaseModel):
    assessment_id: int
    user_id: int
    total_questions: int
    answered_questions: int
    completion_percentage: float