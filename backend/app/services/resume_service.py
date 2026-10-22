import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeAnalysis
from app.utils.llm import generate_json

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "resumes"
MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_TEXT_CHARS = 20000

RESUME_PROMPT = """You are CareerPilot AI, an experienced campus recruiter and resume reviewer in India.
Review the resume honestly and constructively for a student or early-career candidate.
Base every point only on what is written in the resume; do not invent experience.
Give specific, actionable improvements (what to change and how). Respond only with JSON matching the schema."""


def extract_pdf_text(data: bytes):
    try:
        reader = PdfReader(io.BytesIO(data))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except PdfReadError:
        raise HTTPException(status_code=400, detail="Could not read this PDF file")

    text = text.strip()
    if len(text) < 50:
        raise HTTPException(
            status_code=400,
            detail="No readable text found in the PDF (scanned image PDFs are not supported)"
        )

    return text[:MAX_TEXT_CHARS]


def get_resume(db: Session, user_id: int):
    return db.query(Resume).filter(Resume.user_id == user_id).first()


def delete_resume_file(resume: Resume):
    Path(resume.file_path).unlink(missing_ok=True)


def upload_resume(
    db: Session,
    user: User,
    file: UploadFile,
    target_role: str | None
):
    filename = file.filename or "resume.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported")

    data = file.file.read(MAX_FILE_SIZE + 1)
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Resume must be 5 MB or smaller")
    if not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File is not a valid PDF")

    text = extract_pdf_text(data)

    role_line = f"Target role: {target_role}" if target_role else "Target role: not specified"
    analysis = generate_json(
        RESUME_PROMPT,
        f"{role_line}\n\nResume text:\n{text}",
        ResumeAnalysis
    )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / f"{user.id}_{uuid.uuid4().hex}.pdf"
    file_path.write_bytes(data)

    resume = get_resume(db, user.id)
    if resume:
        delete_resume_file(resume)
    else:
        resume = Resume(user_id=user.id)
        db.add(resume)

    resume.filename = filename
    resume.file_path = str(file_path)
    resume.target_role = target_role
    resume.extracted_text = text
    resume.analysis = analysis

    db.commit()
    db.refresh(resume)

    return resume


def delete_resume(db: Session, user_id: int):
    resume = get_resume(db, user_id)
    if not resume:
        raise HTTPException(status_code=404, detail="No resume uploaded")

    delete_resume_file(resume)
    db.delete(resume)
    db.commit()
