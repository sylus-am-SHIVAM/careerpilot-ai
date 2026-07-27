# CareerPilot AI - System Architecture

## Overview

CareerPilot AI is a full-stack AI-powered career guidance platform designed to help students discover suitable career paths, analyze resumes, identify skill gaps, generate learning roadmaps, and interact with an AI mentor.

---

## High-Level Architecture

```
                 User
                   │
                   ▼
           Next.js Frontend
                   │
         REST API / WebSocket
                   │
                   ▼
            FastAPI Backend
         ┌─────────┼─────────┐
         │         │         │
         ▼         ▼         ▼
 PostgreSQL   ChromaDB   AI Services
    │             │           │
    │             │           │
    ▼             ▼           ▼
 User Data   Embeddings   LLM APIs
```

---

## Main Components

### Frontend

- Next.js
- React
- Tailwind CSS

### Backend

- FastAPI
- SQLAlchemy
- REST API

### Database

- PostgreSQL

### Vector Database

- ChromaDB

### AI Layer

- OpenAI / Gemini
- LangChain
- Hugging Face

---

Status: 🚧 Design Phase
