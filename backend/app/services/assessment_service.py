from sqlalchemy.orm import Session

# from app.models.assessment import Assessment, Question, Option
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
    return db.query(Assessment).all()
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
    return (
        db.query(Question)
        .filter(Question.assessment_id == assessment_id)
        .all()
    )


def create_user_answer(
    db: Session,
    user_id: int,
    answer: UserAnswerCreate
):
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
        db.query(UserAnswer)
        .join(
            Question,
            UserAnswer.question_id == Question.id
        )
        .filter(
            UserAnswer.user_id == user_id,
            Question.assessment_id == assessment_id
        )
        .count()
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