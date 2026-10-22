from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.utils.security import get_current_user
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    QuestionCreate,
    QuestionResponse,
    OptionCreate,

    OptionResponse,

    UserAnswerCreate,

    UserAnswerResponse,
    AssessmentResultResponse,
    RecommendationResponse
)
from app.services.career_service import get_recommendation
from app.services.assessment_service import (
    create_assessment,
    get_assessments,
    get_assessment,
    create_question,
    get_questions,
    create_user_answer,
    get_assessment_result,
    get_user_answers,
    reset_user_answers
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
    if not get_assessment(db, assessment_id):
        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    return get_questions(
        db,
        assessment_id
    )


@router.post("/answers", response_model=UserAnswerResponse)
def submit_answer(
    answer: UserAnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_user_answer(
        db,
        current_user.id,
        answer
    )


@router.get(
    "/{assessment_id}/answers",
    response_model=list[UserAnswerResponse]
)
def get_my_answers(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_answers(
        db,
        assessment_id,
        current_user.id
    )


@router.delete("/{assessment_id}/answers")
def retake_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not get_assessment(db, assessment_id):
        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    deleted = reset_user_answers(db, assessment_id, current_user.id)

    return {"message": "Your answers were cleared. You can retake the assessment.", "deleted": deleted}


@router.get(
    "/{assessment_id}/result",
    response_model=AssessmentResultResponse
)
def get_result(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = get_assessment_result(
        db,
        assessment_id,
        current_user.id
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    return result


@router.get(
    "/{assessment_id}/recommendation",
    response_model=RecommendationResponse
)
def get_career_recommendation(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_recommendation(
        db,
        assessment_id,
        current_user.id
    )
