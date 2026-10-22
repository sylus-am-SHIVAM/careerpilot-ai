from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.data.career_assessment import OPTION_WEIGHTS, QUESTION_SECTIONS, SECTIONS
from app.models.assessment import Option, Question, UserAnswer
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

# How much each career draws on each category; used to rank specific careers.
CAREER_PROFILES = [
    ("Software Engineer", {"technology": 1.0}),
    ("Machine Learning Engineer", {"technology": 0.6, "research": 0.4}),
    ("Data Scientist", {"technology": 0.5, "research": 0.5}),
    ("Cybersecurity Analyst", {"technology": 0.8, "research": 0.2}),
    ("Game Developer", {"technology": 0.6, "creative": 0.4}),
    ("Research Scientist", {"research": 1.0}),
    ("Data Analyst", {"research": 0.6, "business": 0.4}),
    ("Biotechnologist", {"research": 0.7, "social": 0.3}),
    ("Professor / Academic Researcher", {"research": 0.6, "social": 0.4}),
    ("Doctor / Healthcare Professional", {"social": 0.6, "research": 0.4}),
    ("Psychologist / Counsellor", {"social": 0.8, "research": 0.2}),
    ("Teacher / Educator", {"social": 0.8, "creative": 0.2}),
    ("HR Specialist", {"social": 0.6, "business": 0.4}),
    ("Social Worker / NGO Professional", {"social": 1.0}),
    ("UI/UX Designer", {"creative": 0.6, "technology": 0.4}),
    ("Graphic Designer", {"creative": 1.0}),
    ("Content Writer / Journalist", {"creative": 0.7, "social": 0.3}),
    ("Film / Media Producer", {"creative": 0.7, "business": 0.3}),
    ("Architect", {"creative": 0.5, "technology": 0.3, "research": 0.2}),
    ("Product Manager", {"business": 0.5, "technology": 0.3, "creative": 0.2}),
    ("Entrepreneur", {"business": 0.7, "creative": 0.3}),
    ("Management Consultant", {"business": 0.7, "research": 0.3}),
    ("Marketing Manager", {"business": 0.6, "creative": 0.4}),
    ("Finance Analyst / Chartered Accountant", {"business": 0.7, "research": 0.3}),
]

CAREER_MATCH_LIMIT = 6


def score_answers(option_texts):
    scores = {key: 0 for key in CAREER_CATEGORIES}
    for text in option_texts:
        for key, weight in OPTION_WEIGHTS.get(text.strip().lower(), {}).items():
            scores[key] += weight
    return scores


def get_match_strength(percentages):
    ordered = sorted(percentages.values(), reverse=True)
    lead = ordered[0] - ordered[1]
    if lead >= 15:
        return "strong"
    if lead >= 6:
        return "moderate"
    return "mixed"


def rank_careers(percentages):
    best = max(percentages.values())
    matches = []
    for name, profile in CAREER_PROFILES:
        fit = sum(weight * percentages[key] for key, weight in profile.items())
        matches.append({
            "name": name,
            "category": CAREER_CATEGORIES[max(profile, key=profile.get)]["name"],
            "fit": round(fit / best * 100),
        })
    matches.sort(key=lambda m: m["fit"], reverse=True)
    return matches[:CAREER_MATCH_LIMIT]


def get_section_results(questions, answers):
    answered_by_section = {}
    for answer in answers:
        section = QUESTION_SECTIONS.get(answer.question_text)
        if section:
            answered_by_section.setdefault(section, []).append(answer.option_text)

    sections_in_assessment = {QUESTION_SECTIONS.get(text) for (text,) in questions}
    results = []
    for key, name in SECTIONS.items():
        if key not in sections_in_assessment:
            continue
        options = answered_by_section.get(key, [])
        scores = score_answers(options)
        best = max(scores.values())
        results.append({
            "key": key,
            "name": name,
            "answered": len(options),
            "top_category": (
                CAREER_CATEGORIES[max(scores, key=scores.get)]["name"]
                if best > 0 else None
            ),
        })
    return results


def get_recommendation(db: Session, assessment_id: int, user_id: int):
    if not get_assessment(db, assessment_id):
        raise HTTPException(
            status_code=404,
            detail="Assessment not found"
        )

    questions = (
        db.query(Question.question_text)
        .filter(Question.assessment_id == assessment_id)
        .all()
    )

    answers = (
        db.query(UserAnswer.question_id, Question.question_text, Option.option_text)
        .join(Question, UserAnswer.question_id == Question.id)
        .join(Option, UserAnswer.option_id == Option.id)
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

    scores = score_answers(a.option_text for a in answers)

    total_points = sum(scores.values())
    if total_points == 0:
        raise HTTPException(
            status_code=400,
            detail="Your answers do not match any career category yet"
        )

    percentages = {
        key: round(score / total_points * 100, 1)
        for key, score in scores.items()
    }
    best = max(scores.values())

    return {
        "assessment_id": assessment_id,
        "user_id": user_id,
        "answered_questions": len({a.question_id for a in answers}),
        "total_questions": len(questions),
        "match_strength": get_match_strength(percentages),
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
                    "percentage": percentages[key],
                }
                for key, score in scores.items()
            ],
            key=lambda s: s["score"],
            reverse=True
        ),
        "sections": get_section_results(questions, answers),
        "career_matches": rank_careers(percentages),
    }
