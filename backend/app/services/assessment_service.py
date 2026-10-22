from fastapi import HTTPException
from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from app.data.career_assessment import QUESTION_SECTIONS, SECTIONS
from app.models.assessment import (
    Assessment,
    Question,
    Option,
    UserAnswer
)

# from app.schemas.assessment import AssessmentCreate, QuestionCreate
from app.schemas.assessment import (
    AssessmentCreate,
    QuestionCreate,
    UserAnswerCreate
)


def create_assessment(db: Session, assessment: AssessmentCreate):
    db_assessment = Assessment(
        title=assessment.title,
        description=assessment.description
    )

    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)

    return db_assessment


def get_assessments(db: Session):
    return db.query(Assessment).order_by(Assessment.id.desc()).all()
def create_question(
    db: Session,
    assessment_id: int,
    question: QuestionCreate
):
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id)
        .first()
    )

    if not assessment:
        return None

    db_question = Question(
        assessment_id=assessment_id,
        question_text=question.question_text
    )

    db.add(db_question)
    db.flush()

    for option in question.options:
        db_option = Option(
            question_id=db_question.id,
            option_text=option.option_text
        )
        db.add(db_option)

    db.commit()
    db.refresh(db_question)

    return db_question

def get_questions(
    db: Session,
    assessment_id: int
):
    questions = (
        db.query(Question)
        .filter(Question.assessment_id == assessment_id)
        .order_by(Question.id)
        .all()
    )

    return [
        {
            "id": question.id,
            "assessment_id": question.assessment_id,
            "question_text": question.question_text,
            "section": SECTIONS.get(QUESTION_SECTIONS.get(question.question_text)),
            "options": question.options,
        }
        for question in questions
    ]


def get_assessment(db: Session, assessment_id: int):
    return (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id)
        .first()
    )


def create_user_answer(
    db: Session,
    user_id: int,
    answer: UserAnswerCreate
):
    question = (
        db.query(Question)
        .filter(Question.id == answer.question_id)
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    option = (
        db.query(Option)
        .filter(
            Option.id == answer.option_id,
            Option.question_id == answer.question_id
        )
        .first()
    )

    if not option:
        raise HTTPException(
            status_code=400,
            detail="Option does not belong to this question"
        )

    db_answer = (
        db.query(UserAnswer)
        .filter(
            UserAnswer.user_id == user_id,
            UserAnswer.question_id == answer.question_id
        )
        .first()
    )

    if db_answer:
        db_answer.option_id = answer.option_id
    else:
        db_answer = UserAnswer(
            user_id=user_id,
            question_id=answer.question_id,
            option_id=answer.option_id
        )
        db.add(db_answer)

    db.commit()
    db.refresh(db_answer)

    return db_answer


def get_assessment_result(
    db: Session,
    assessment_id: int,
    user_id: int
):
    assessment = (
        db.query(Assessment)
        .filter(Assessment.id == assessment_id)
        .first()
    )

    if not assessment:
        return None

    total_questions = (
        db.query(Question)
        .filter(Question.assessment_id == assessment_id)
        .count()
    )

    answered_questions = (
        db.query(func.count(distinct(UserAnswer.question_id)))
        .join(
            Question,
            UserAnswer.question_id == Question.id
        )
        .filter(
            UserAnswer.user_id == user_id,
            Question.assessment_id == assessment_id
        )
        .scalar()
    )

    completion_percentage = (
        (answered_questions / total_questions) * 100
        if total_questions > 0
        else 0
    )

    return {
        "assessment_id": assessment_id,
        "user_id": user_id,
        "total_questions": total_questions,
        "answered_questions": answered_questions,
        "completion_percentage": completion_percentage
    }

def get_user_answers(
    db: Session,
    assessment_id: int,
    user_id: int
):
    return (
        db.query(UserAnswer)
        .join(Question, UserAnswer.question_id == Question.id)
        .filter(
            UserAnswer.user_id == user_id,
            Question.assessment_id == assessment_id
        )
        .all()
    )


def reset_user_answers(
    db: Session,
    assessment_id: int,
    user_id: int
):
    question_ids = (
        db.query(Question.id)
        .filter(Question.assessment_id == assessment_id)
    )

    deleted = (
        db.query(UserAnswer)
        .filter(
            UserAnswer.user_id == user_id,
            UserAnswer.question_id.in_(question_ids)
        )
        .delete(synchronize_session=False)
    )
    db.commit()

    return deleted
