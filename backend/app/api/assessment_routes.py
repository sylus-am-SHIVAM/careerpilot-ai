from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    QuestionCreate,
    QuestionResponse,
    OptionCreate,

    OptionResponse,

    UserAnswerCreate,

    UserAnswerResponse,
    AssessmentResultResponse
)
from app.services.assessment_service import (
    create_assessment,
    get_assessments,
    create_question,
    get_questions,
    create_user_answer,
    get_assessment_result
)

router = APIRouter(
    prefix="/api/v1/assessments",
    tags=["Assessments"]
)


@router.post("/", response_model=AssessmentResponse)
def create_new_assessment(
    assessment: AssessmentCreate,
    db: Session = Depends(get_db)
):
    return create_assessment(db, assessment)


@router.get("/", response_model=list[AssessmentResponse])
def get_all_assessments(
    db: Session = Depends(get_db)
):
    return get_assessments(db)

@router.post(
    "/{assessment_id}/questions",
    response_model=QuestionResponse
)
def create_new_question(
    assessment_id: int,
    question: QuestionCreate,
    db: Session = Depends(get_db)
):
    result = create_question(
        db,
        assessment_id,
        question
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    return result


@router.get(
    "/{assessment_id}/questions",
    response_model=list[QuestionResponse]
)
def get_all_questions(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    return get_questions(
        db,
        assessment_id
    )


@router.post("/answers", response_model=UserAnswerResponse)
def submit_answer(
    answer: UserAnswerCreate,
    db: Session = Depends(get_db)
):
    user_id = 6

    return create_user_answer(
        db,
        user_id,
        answer
    )


@router.get(
    "/{assessment_id}/result",
    response_model=AssessmentResultResponse
)
def get_result(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    user_id = 6

    result = get_assessment_result(
        db,
        assessment_id,
        user_id
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    return result