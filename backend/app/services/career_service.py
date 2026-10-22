from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.assessment import Question, UserAnswer
from app.services.assessment_service import get_assessment


CAREER_CATEGORIES = {
    "technology": {
        "name": "Technology & Engineering",
        "description": "You enjoy solving technical problems and building things with logic and code.",
        "careers": ["Software Engineer", "Data Scientist", "Machine Learning Engineer", "Cybersecurity Analyst"],
    },
    "research": {
        "name": "Science & Research",
        "description": "You are curious, like deep independent study and discovering how things work.",
        "careers": ["Research Scientist", "Data Analyst", "Biotechnologist", "Professor / Academic Researcher"],
    },
    "social": {
        "name": "Social, Teaching & Healthcare",
        "description": "You are motivated by helping, teaching and working closely with people.",
        "careers": ["Teacher / Educator", "Psychologist / Counsellor", "Doctor / Healthcare Professional", "HR Specialist"],
    },
    "creative": {
        "name": "Creative Arts & Design",
        "description": "You like expressing ideas and creating original work.",
        "careers": ["UI/UX Designer", "Content Writer", "Graphic Designer", "Film / Media Producer"],
    },
    "business": {
        "name": "Business & Management",
        "description": "You like leading people, organising projects and making decisions.",
        "careers": ["Product Manager", "Business Analyst", "Entrepreneur", "Management Consultant"],
    },
}

# Scoring rules for "Career Interest Assessment" (assessment 1), agreed with Shivam on 22 Oct 2026.
# Each selected option gives 1 point to every category listed. Option 8 ("mix") scores nothing.
OPTION_CATEGORIES = {
    1: ["technology"],
    2: ["social"],
    3: ["creative"],
    4: ["business"],
    5: ["technology", "research"],
    6: ["social"],
    7: ["business"],
    8: [],
    9: ["technology"],
    10: ["research"],
    11: ["business"],
    12: ["creative"],
    13: ["technology"],
    14: ["research"],
    15: ["social"],
    16: ["creative"],
    17: ["technology"],
    18: ["social"],
    19: ["creative"],
    20: ["business"],
}


def get_recommendation(db: Session, assessment_id: int, user_id: int):
    if not get_assessment(db, assessment_id):
        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    total_questions = (
        db.query(Question)
        .filter(Question.assessment_id == assessment_id)
        .count()
    )

    answers = (
        db.query(UserAnswer)
        .join(Question, UserAnswer.question_id == Question.id)
        .filter(
            UserAnswer.user_id == user_id,
            Question.assessment_id == assessment_id
        )
        .all()
    )

    if not answers:
        raise HTTPException(
            status_code=400,
            detail="Answer at least one question to get a recommendation"
        )

    scores = {key: 0 for key in CAREER_CATEGORIES}
    for answer in answers:
        for key in OPTION_CATEGORIES.get(answer.option_id, []):
            scores[key] += 1

    total_points = sum(scores.values())
    if total_points == 0:
        raise HTTPException(
            status_code=400,
            detail="Your answers do not match any career category yet"
        )

    best = max(scores.values())

    return {
        "assessment_id": assessment_id,
        "user_id": user_id,
        "answered_questions": len({a.question_id for a in answers}),
        "total_questions": total_questions,
        "top_categories": [
            {"key": key, **CAREER_CATEGORIES[key]}
            for key, score in scores.items()
            if score == best
        ],
        "scores": sorted(
            [
                {
                    "key": key,
                    "name": CAREER_CATEGORIES[key]["name"],
                    "score": score,
                    "percentage": round(score / total_points * 100, 1),
                }
                for key, score in scores.items()
            ],
            key=lambda s: s["score"],
            reverse=True
        ),
    }
