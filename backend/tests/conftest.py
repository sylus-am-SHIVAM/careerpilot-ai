import os
import tempfile
from pathlib import Path

TEST_DIR = Path(tempfile.mkdtemp(prefix="careerpilot-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DIR / 'test.db'}"
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ["GEMINI_API_KEY"] = ""

import pytest
from fastapi.testclient import TestClient

from app.database.database import Base, engine
from app.main import app
from app.seed import seed_assessment
from app.services import mentor_service, planner_service, resume_service


@pytest.fixture(autouse=True)
def fresh_database(monkeypatch):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_assessment()

    monkeypatch.setattr(resume_service, "UPLOAD_DIR", TEST_DIR / "uploads")
    monkeypatch.setattr(mentor_service, "search_knowledge", fake_search)
    monkeypatch.setattr(mentor_service, "generate_text", fake_generate_text)
    monkeypatch.setattr(planner_service, "generate_json", fake_generate_json)
    monkeypatch.setattr(resume_service, "generate_json", fake_generate_json)
    yield


def fake_search(query, top_k=3):
    return [
        {"text": "UI/UX Designer guide", "source": "creative.md", "section": "UI/UX Designer", "distance": 0.2},
        {"text": "Unrelated", "source": "social.md", "section": "Doctor", "distance": 0.45},
    ]


def fake_generate_text(system_prompt, contents, temperature=0.7):
    return f"Mock mentor reply to: {contents[-1]['parts'][0]['text']}"


def fake_generate_json(system_prompt, prompt, schema=None):
    name = schema.__name__ if schema else ""
    if name == "RoadmapContent":
        return {
            "title": "Mock roadmap",
            "summary": "Summary",
            "phases": [{
                "title": "Basics",
                "weeks": "Weeks 1-4",
                "goals": ["Learn Python"],
                "skills": ["Python"],
                "resources": ["CS50"],
                "project": "CLI app",
            }],
            "final_outcome": "Job ready",
        }
    if name == "SkillGapContent":
        return {
            "readiness_score": 60,
            "summary": prompt,
            "matching_skills": ["Python"],
            "missing_skills": [{"skill": "Docker", "priority": "high", "reason": "r", "how_to_learn": "h"}],
            "next_steps": ["Build a project"],
        }
    return {
        "overall_score": 70,
        "summary": "Good resume",
        "experience_level": "student",
        "extracted_skills": ["Python", "FastAPI"],
        "education": ["B.Tech CSE"],
        "strengths": ["Projects"],
        "improvements": ["Add metrics"],
        "section_feedback": [{"section": "Projects", "feedback": "Add impact"}],
        "ats_tips": ["Use keywords"],
        "suggested_roles": ["Backend Developer Intern"],
    }


@pytest.fixture
def client():
    return TestClient(app)


def register(client, email="student@example.com", password="secret123", name="Student One"):
    response = client.post("/api/v1/users", json={"full_name": name, "email": email, "password": password})
    assert response.status_code == 200, response.text
    token = client.post("/api/v1/login", data={"username": email, "password": password}).json()["access_token"]
    return response.json(), {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth(client):
    return register(client)
