from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    questions = relationship(
        "Question",
        back_populates="assessment",
        cascade="all, delete-orphan"
    )


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(
        Integer,
        ForeignKey("assessments.id"),
        nullable=False
    )
    question_text = Column(Text, nullable=False)

    assessment = relationship(
        "Assessment",
        back_populates="questions"
    )

    options = relationship(
        "Option",
        back_populates="question",
        cascade="all, delete-orphan"
    )


class Option(Base):
    __tablename__ = "options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(
        Integer,
        ForeignKey("questions.id"),
        nullable=False
    )
    option_text = Column(String, nullable=False)

    question = relationship(
        "Question",
        back_populates="options"
    )


class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    question_id = Column(
        Integer,
        ForeignKey("questions.id"),
        nullable=False
    )
    option_id = Column(
        Integer,
        ForeignKey("options.id"),
        nullable=False
    )