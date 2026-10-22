# CareerPilot AI — Backend

FastAPI + PostgreSQL + Gemini + ChromaDB. See the root [README](../README.md) for setup, endpoints and architecture.

Quick start (inside `backend/` with the virtualenv active):

```bash
python -m app.seed
uvicorn app.main:app --reload
python -m pytest -q
```
