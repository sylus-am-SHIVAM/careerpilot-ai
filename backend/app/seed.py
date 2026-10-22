import random

from app.data.career_assessment import (
    ASSESSMENT_DESCRIPTION,
    ASSESSMENT_TITLE,
    QUESTIONS
)
from app.database.database import Base, SessionLocal, engine
from app.models.assessment import Assessment, Option, Question
import app.main  # noqa: F401  (registers all models)


def seed_assessment():
    db = SessionLocal()
    try:
        if db.query(Assessment).filter(Assessment.title == ASSESSMENT_TITLE).first():
            print(f'"{ASSESSMENT_TITLE}" already exists, nothing to do')
            return

        assessment = Assessment(title=ASSESSMENT_TITLE, description=ASSESSMENT_DESCRIPTION)
        for index, item in enumerate(QUESTIONS):
            options = [text for text, _ in item["options"]]
            random.Random(index).shuffle(options)
            question = Question(question_text=item["text"])
            question.options = [Option(option_text=text) for text in options]
            assessment.questions.append(question)

        db.add(assessment)
        db.commit()
        print(f'Created "{ASSESSMENT_TITLE}" with {len(QUESTIONS)} questions')
    finally:
        db.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_assessment()
