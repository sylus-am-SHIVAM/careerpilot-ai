from fastapi import FastAPI
from app.api.routes import router
from app.api.assessment_routes import router as assessment_router
from app.database.database import engine, Base
from app.models.user import User
from app.models.assessment import Assessment, Question, Option, UserAnswer
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CareerPilot AI",
    description="An AI-powered career guidance platform that provides personalized career recommendations, learning roadmaps, resume analysis, and AI mentorship using LLMs and RAG.",
    version="0.1.0",
    contact={
        "name": "Shivam Chaurasia",
        "url": "https://github.com/sylus-am-SHIVAM/careerpilot-ai",
    },
)

app.include_router(router)
app.include_router(assessment_router)
