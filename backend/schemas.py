from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

# Student schemas
class StudentBase(BaseModel):
    name: str
    email: str
    roll_number: str
    department: str
    section: str
    year: int
    mentor_id: Optional[int] = None

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    
    class Config:
        from_attributes = True

# Attendance schemas
class AttendanceBase(BaseModel):
    student_id: int
    attendance_percentage: float
    month: Optional[str] = None
    date: Optional[date] = None

class Attendance(AttendanceBase):
    id: int
    
    class Config:
        from_attributes = True

# Grade schemas
class GradeBase(BaseModel):
    student_id: int
    subject: str
    marks: float
    exam_type: str

class Grade(GradeBase):
    id: int
    
    class Config:
        from_attributes = True

# Disciplinary Record schemas
class DisciplinaryRecordBase(BaseModel):
    student_id: int
    description: str
    date: date

class DisciplinaryRecord(DisciplinaryRecordBase):
    id: int
    
    class Config:
        from_attributes = True

# Activity schemas
class ActivityBase(BaseModel):
    student_id: int
    activity_name: str
    date: date

class Activity(ActivityBase):
    id: int
    
    class Config:
        from_attributes = True

# Mentor Note schemas
class MentorNoteBase(BaseModel):
    student_id: int
    mentor_id: int
    note: str
    action_taken: Optional[str] = None
    follow_up_date: Optional[date] = None

class MentorNoteCreate(MentorNoteBase):
    pass

class MentorNote(MentorNoteBase):
    id: int
    date: datetime
    
    class Config:
        from_attributes = True

# Risk Flag schemas
class RiskFlagBase(BaseModel):
    student_id: int
    attendance_score: float
    academic_score: float
    discipline_score: float
    assignment_score: float
    activity_score: float
    total_score: float
    risk_level: str

class RiskFlag(RiskFlagBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Student with risk data
class StudentWithRisk(Student):
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    attendance_percentage: Optional[float] = None
    average_grade: Optional[float] = None
    disciplinary_count: Optional[int] = None
    activity_count: Optional[int] = None
    risk_factors: Optional[List[str]] = None

# Dashboard summary
class DashboardSummary(BaseModel):
    total_students: int
    high_risk: int
    medium_risk: int
    low_risk: int
    average_attendance: float
    average_grade: float
    departments: List[str]
    risk_level: Optional[str] = None