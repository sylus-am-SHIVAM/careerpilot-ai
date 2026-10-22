# CareerPilot AI 🚀

An AI-powered career guidance platform for students. It recommends career paths from an interest assessment, answers questions through an AI mentor grounded in a career knowledge base (RAG), generates learning roadmaps, finds skill gaps and reviews resumes.

---

## ✨ Features

| Feature | What it does |
|---|---|
| 🔐 Authentication | Register / login with bcrypt-hashed passwords and JWT tokens |
| 🎯 Career assessment | 20-question assessment across 5 parameters (interests, strengths, work style, values, academics) with weighted scoring, match strength, per-parameter insights and ranked career matches |
| 🤖 AI mentor (RAG) | Gemini-powered chat that retrieves relevant career knowledge from ChromaDB, knows the student's assessment and resume, remembers the conversation and shows its sources |
| 🛣️ Learning roadmap | Week-by-week plan (phases, goals, skills, resources, projects) for any goal |
| 📈 Skill gap analysis | Readiness score, matching skills and prioritised missing skills for a target role (can reuse resume skills) |
| 📄 Resume review | PDF upload → text extraction → AI score, strengths, improvements, section feedback, ATS tips, suggested roles |
| 📊 Dashboard | One page summary of all of the above |

---

## 🏗 Architecture

```
 Next.js + Tailwind (frontend/)         http://localhost:3000
            │  REST + JWT (Authorization: Bearer)
            ▼
 FastAPI (backend/app)                  http://127.0.0.1:8000
   api/        routes (HTTP layer, auth via Depends(get_current_user))
   services/   business logic
   models/     SQLAlchemy tables      ──►  PostgreSQL
   utils/llm   Gemini client          ──►  Google Gemini (chat, JSON, embeddings)
   services/rag_service               ──►  ChromaDB (backend/chroma_db)
                                              ▲
                     datasets/career_knowledge/*.md (knowledge base)
```

Request flow example (AI mentor):
`POST /api/v1/chat` → JWT verified → `mentor_service` → RAG search in ChromaDB → prompt with student profile + retrieved knowledge + last 10 messages → Gemini → reply saved in `chat_messages` → response with sources.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, react-markdown
- **Backend:** FastAPI, SQLAlchemy 2, Pydantic 2, python-jose (JWT), passlib/bcrypt, pypdf
- **Database:** PostgreSQL
- **AI:** Google Gemini (`gemini-3.8-flash` for text/JSON, `gemini-embedding-001` for embeddings), ChromaDB for vector search
- **Testing:** pytest + FastAPI TestClient (SQLite + mocked AI)

---

## ⚙️ Setup

### Prerequisites
- Python 3.11+ (developed on 3.13), Node.js 20+, PostgreSQL
- A Gemini API key from https://aistudio.google.com/apikey

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # then fill DATABASE_URL, SECRET_KEY, GEMINI_API_KEY
python -m app.seed            # creates tables + the Career Interest Assessment
python -m app.services.rag_service   # builds the ChromaDB knowledge index (optional, also auto-built on first chat)

uvicorn app.main:app --reload
```

API docs (Swagger): http://127.0.0.1:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # optional, default already points to http://127.0.0.1:8000/api/v1
npm run dev                   # development
# or for a demo: npm run build && npm start
```

Open http://localhost:3000, create an account and start with the assessment.

### 3. Tests

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest -q
```

Tests run against a temporary SQLite database with Gemini and ChromaDB mocked, so they never touch your real data or use API credits.

---

## 🔌 API Endpoints (`/api/v1`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users` | – | Register |
| POST | `/login` | – | Get JWT (form fields `username`=email, `password`) |
| GET | `/me` | ✅ | Current user |
| GET/PUT/DELETE | `/users/{id}` | ✅ | Get user / update or delete own account |
| GET | `/assessments/` | – | List assessments |
| GET | `/assessments/{id}/questions` | – | Questions with options |
| POST | `/assessments/answers` | ✅ | Save (or change) an answer |
| GET | `/assessments/{id}/answers` | ✅ | My answers |
| GET | `/assessments/{id}/result` | ✅ | Completion progress |
| GET | `/assessments/{id}/recommendation` | ✅ | Career category scores and top careers |
| POST | `/chat` | ✅ | Ask the AI mentor |
| GET | `/chat/history` | ✅ | My conversation |
| POST | `/roadmap/generate` | ✅ | Generate a learning roadmap |
| GET | `/roadmap`, `/roadmap/{id}` | ✅ | My roadmaps |
| POST/GET | `/skill-gap` | ✅ | Analyse / list skill gap reports |
| POST | `/resume/upload` | ✅ | Upload PDF resume (max 5 MB) for analysis |
| GET/DELETE | `/resume` | ✅ | My resume analysis / delete it |

---

## 📁 Project Structure

```
backend/
  app/
    main.py              FastAPI app, CORS, routers, table creation
    seed.py              seeds the Career Interest Assessment
    api/                 routes: users/auth, assessments, chat, roadmap & skill gap, resume
    services/            assessment, career (scoring), mentor, rag, planner, resume, user
    models/              SQLAlchemy models
    schemas/             Pydantic request/response schemas
    data/                assessment questions + option → category scoring rules
    utils/               security (JWT, bcrypt), llm (Gemini client with retries)
  tests/                 pytest suite
datasets/career_knowledge/   markdown knowledge base used for RAG
frontend/src/
  app/                   pages: landing, login, register, (app)/dashboard, assessment, mentor, roadmap, skill-gap, resume
  components/            shared UI
  lib/                   API client and auth context
docs/                    early design notes
```

---

## 🧠 How the career scoring works

The Career Discovery Assessment has 20 questions in 5 parameters: Interests, Strengths & Aptitude, Work Style & Personality, Values & Motivation, and Academics & Experience. Every option gives weighted points (2 = strong signal, 1 = secondary signal) to one or more of 5 categories (Technology & Engineering, Science & Research, Social/Teaching/Healthcare, Creative Arts & Design, Business & Management).

- **Category %** = category points / all points.
- **Match strength** = lead of the top category over the second (≥15 points strong, ≥6 good, otherwise a mixed profile).
- **Per-parameter insight** = the leading category inside each of the 5 parameters.
- **Career matches** = 24 careers, each described as a blend of categories (e.g. UI/UX Designer = 60% creative + 40% technology), ranked against the student's profile.

Rules live in `backend/app/data/career_assessment.py` and `backend/app/services/career_service.py`. The older 5-question assessment is kept so earlier answers still score.

---

## ⚠️ Limitations

- No database migrations yet (tables are created with `create_all`; schema changes to existing tables need manual SQL or Alembic).
- AI responses depend on Gemini availability; transient errors are retried 3 times, after that the API returns `502`.
- Scanned (image-only) PDF resumes are not supported.
- The knowledge base is a small curated set of documents; answers outside it rely on the model's general knowledge.

## 🔭 Future Work

- Alembic migrations and deployment (Docker, hosted PostgreSQL)
- Larger knowledge base (colleges, courses, internships) and mock interview practice
- Progress tracking against roadmap milestones

---

## 👤 Author

**Shivam Chaurasia** — B.Tech CSE, IIT Bhilai
GitHub: [sylus-am-SHIVAM](https://github.com/sylus-am-SHIVAM)
