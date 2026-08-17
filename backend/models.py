from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    roll_number = Column(String(20), unique=True, nullable=False)
    department = Column(String(50), nullable=False)
    section = Column(String(10), nullable=False)
    year = Column(Integer, nullable=False)
    mentor_id = Column(Integer, nullable=True)
    
    # Relationships
    attendance = relationship("Attendance", back_populates="student")
    grades = relationship("Grade", back_populates="student")
    disciplinary_records = relationship("DisciplinaryRecord", back_populates="student")
    activities = relationship("Activity", back_populates="student")
    notes = relationship("MentorNote", back_populates="student")
    risk_flags = relationship("RiskFlag", back_populates="student")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    attendance_percentage = Column(Float, nullable=False)
    month = Column(String(10), nullable=True)
    date = Column(Date, nullable=True)
    
    # Relationship
    student = relationship("Student", back_populates="attendance")

class Grade(Base):
    __tablename__ = "grades"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    marks = Column(Float, nullable=False)
    exam_type = Column(String(50), nullable=False)
    
    # Relationship
    student = relationship("Student", back_populates="grades")

class DisciplinaryRecord(Base):
    __tablename__ = "disciplinary_records"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    description = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    
    # Relationship
    student = relationship("Student", back_populates="disciplinary_records")

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    activity_name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    
    # Relationship
    student = relationship("Student", back_populates="activities")

class MentorNote(Base):
    __tablename__ = "mentor_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    mentor_id = Column(Integer, nullable=False)
    note = Column(Text, nullable=False)
    action_taken = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    date = Column(DateTime, default=datetime.now)
    
    # Relationship
    student = relationship("Student", back_populates="notes")

class RiskFlag(Base):
    __tablename__ = "risk_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    attendance_score = Column(Float, nullable=False)
    academic_score = Column(Float, nullable=False)
    discipline_score = Column(Float, nullable=False)
    assignment_score = Column(Float, nullable=False)
    activity_score = Column(Float, nullable=False)
    total_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationship
    student = relationship("Student", back_populates="risk_flags")