from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from app.database.database import Base
from app.models.career_plan import utc_now


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    target_role = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=False)
    analysis = Column(JSON, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
