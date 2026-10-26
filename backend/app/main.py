import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.api.assessment_routes import router as assessment_router
from app.api.chat_routes import router as chat_router
from app.api.planner_routes import router as planner_router
from app.api.resume_routes import router as resume_router
from app.database.database import engine, Base
from app.models.user import User
from app.models.assessment import Assessment, Question, Option, UserAnswer
from app.models.chat import ChatMessage
from app.models.career_plan import Roadmap, SkillGapReport
from app.models.resume import Resume
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.seed import seed_assessment
    seed_assessment()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="CareerPilot AI",
    description="An AI-powered career guidance platform that provides personalized career recommendations, learning roadmaps, resume analysis, and AI mentorship using LLMs and RAG.",
    version="0.1.0",
    contact={
        "name": "Shivam Chaurasia",
        "url": "https://github.com/sylus-am-SHIVAM/careerpilot-ai",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(assessment_router)
app.include_router(chat_router)
app.include_router(planner_router)
app.include_router(resume_router)
