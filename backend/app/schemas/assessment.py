from pydantic import BaseModel, ConfigDict
from typing import Optional


class AssessmentBase(BaseModel):
    title: str
    description: Optional[str] = None


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentResponse(AssessmentBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
class OptionBase(BaseModel):
    option_text: str


class OptionCreate(OptionBase):
    pass


class OptionResponse(OptionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class QuestionBase(BaseModel):
    question_text: str


class QuestionCreate(QuestionBase):
    options: list[OptionCreate]


class QuestionResponse(QuestionBase):
    id: int
    assessment_id: int
    section: Optional[str] = None
    options: list[OptionResponse]

    model_config = ConfigDict(from_attributes=True)


class UserAnswerCreate(BaseModel):
    question_id: int
    option_id: int


class UserAnswerResponse(BaseModel):
    id: int
    user_id: int
    question_id: int
    option_id: int

    model_config = ConfigDict(from_attributes=True)
        

class AssessmentResultResponse(BaseModel):
    assessment_id: int
    user_id: int
    total_questions: int
    answered_questions: int
    completion_percentage: float


class CareerCategory(BaseModel):
    key: str
    name: str
    description: str
    careers: list[str]


class CategoryScore(BaseModel):
    key: str
    name: str
    score: int
    percentage: float


class SectionResult(BaseModel):
    key: str
    name: str
    answered: int
    top_category: Optional[str] = None


class CareerMatch(BaseModel):
    name: str
    category: str
    fit: int


class RecommendationResponse(BaseModel):
    assessment_id: int
    user_id: int
    answered_questions: int
    total_questions: int
    match_strength: str
    top_categories: list[CareerCategory]
    scores: list[CategoryScore]
    sections: list[SectionResult]
    career_matches: list[CareerMatch]