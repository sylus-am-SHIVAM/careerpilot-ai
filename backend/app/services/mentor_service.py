from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.assessment import Question, UserAnswer
from app.models.chat import ChatMessage
from app.models.user import User
from app.services.career_service import get_recommendation
from app.services.rag_service import search_knowledge
from app.services.resume_service import get_resume
from app.utils.llm import generate_text

HISTORY_LIMIT = 10
RELEVANCE_THRESHOLD = 0.5
RELEVANCE_MARGIN = 0.08

MENTOR_PROMPT = """You are CareerPilot AI, a friendly and practical career mentor for students in India.
Give clear, honest, actionable guidance: suggest concrete skills, resources, projects and next steps.
Keep answers focused and under 250 words unless the student asks for detail.
If you are not sure about a fact (salaries, exam dates, cut-offs), say so instead of guessing.
Only help with career, education, skills and professional growth topics."""


def get_user_career_profile(db: Session, user: User):
    assessment_ids = (
        db.query(Question.assessment_id)
        .join(UserAnswer, UserAnswer.question_id == Question.id)
        .filter(UserAnswer.user_id == user.id)
        .distinct()
        .all()
    )

    lines = []
    for (assessment_id,) in assessment_ids:
        try:
            result = get_recommendation(db, assessment_id, user.id)
        except HTTPException:
            continue
        top = ", ".join(c["name"] for c in result["top_categories"])
        scores = ", ".join(f'{s["name"]} {s["percentage"]}%' for s in result["scores"])
        lines.append(f"Assessment {assessment_id}: best fit {top} (scores: {scores})")

    resume = get_resume(db, user.id)
    if resume:
        analysis = resume.analysis
        lines.append(
            f"Resume ({analysis.get('experience_level')}): "
            f"skills {', '.join(analysis.get('extracted_skills', []))}; "
            f"summary: {analysis.get('summary')}"
        )

    return "\n".join(lines)


def build_system_prompt(db: Session, user: User, context: str = ""):
    prompt = f"{MENTOR_PROMPT}\n\nStudent name: {user.full_name}"

    profile = get_user_career_profile(db, user)
    if profile:
        prompt += f"\nStudent's career assessment results:\n{profile}"

    if context:
        prompt += (
            "\n\nUse this reference material from the CareerPilot knowledge base when relevant:\n"
            f"{context}"
        )

    return prompt


def get_chat_history(db: Session, user_id: int, limit: int = 50):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(messages))


def retrieve_context(message: str):
    try:
        results = search_knowledge(message)
    except HTTPException:
        return "", []

    best = min((r["distance"] for r in results), default=1)
    relevant = [
        r for r in results
        if r["distance"] <= RELEVANCE_THRESHOLD and r["distance"] - best <= RELEVANCE_MARGIN
    ]
    context = "\n\n".join(r["text"] for r in relevant)
    sources = [f'{r["source"]}: {r["section"]}' for r in relevant]

    return context, sources


def chat_with_mentor(db: Session, user: User, message: str):
    context, sources = retrieve_context(message)

    contents = []
    for past in get_chat_history(db, user.id, HISTORY_LIMIT):
        contents.append({"role": "user", "parts": [{"text": past.message}]})
        contents.append({"role": "model", "parts": [{"text": past.response}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    reply = generate_text(build_system_prompt(db, user, context), contents)

    chat = ChatMessage(
        user_id=user.id,
        message=message,
        response=reply
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)

    return chat, sources
