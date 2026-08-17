from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from database import get_db, engine
from models import Student, Attendance, Grade, DisciplinaryRecord, Activity, MentorNote, RiskFlag
from schemas import (
    Student as StudentSchema,
    StudentWithRisk,
    DashboardSummary,
    MentorNoteCreate,
    MentorNote as MentorNoteSchema
)

# Import AI libraries
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier

# Create tables (if they don't exist)
from models import Base
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Student Monitoring System API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== AI MODEL LOADING ====================

# Load AI model (or create a simple one if not trained)
try:
    ai_model = joblib.load("risk_prediction_model.pkl")
    model_loaded = True
    print("✅ AI Model loaded successfully!")
except:
    model_loaded = False
    print("⚠️ AI Model not found. Training a simple model...")
    # Create a simple fallback model
    ai_model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
    # Train on sample data
    sample_X = np.array([
        [40, 40, 3, 1],
        [70, 65, 1, 2],
        [90, 85, 0, 4],
        [50, 50, 2, 1],
        [75, 70, 1, 2],
        [85, 80, 0, 3],
        [35, 45, 4, 0],
        [65, 60, 2, 1],
        [95, 90, 0, 5],
        [55, 55, 2, 1],
        [78, 72, 1, 2],
        [88, 82, 0, 4],
    ])
    sample_y = np.array([2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0])
    ai_model.fit(sample_X, sample_y)
    model_loaded = True

# ==================== STUDENT ENDPOINTS ====================

@app.get("/")
def read_root():
    return {"message": "Student Monitoring System API is running"}

@app.get("/students", response_model=List[StudentWithRisk])
def get_all_students(
    db: Session = Depends(get_db),
    department: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    student_id: Optional[int] = None
):
    """Get all students with their risk data"""
    query = db.query(Student)
    
    # If student_id is provided, only return that student
    if student_id:
        query = query.filter(Student.id == student_id)
    
    # Apply filters
    if department:
        query = query.filter(Student.department == department)
    
    # Get students
    students = query.all()
    
    result = []
    for student in students:
        # Get latest risk flag
        risk = db.query(RiskFlag).filter(RiskFlag.student_id == student.id).order_by(RiskFlag.created_at.desc()).first()
        
        # Get attendance
        attendance_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
        
        # Get grades
        grade_records = db.query(Grade).filter(Grade.student_id == student.id).all()
        avg_grade = sum(g.marks for g in grade_records) / len(grade_records) if grade_records else 0
        
        # Get counts
        disciplinary_count = db.query(DisciplinaryRecord).filter(DisciplinaryRecord.student_id == student.id).count()
        activity_count = db.query(Activity).filter(Activity.student_id == student.id).count()
        
        # Get risk factors
        risk_factors = []
        if risk:
            if risk.attendance_score > 20:
                risk_factors.append("Low attendance")
            if risk.academic_score > 20:
                risk_factors.append("Poor academic performance")
            if risk.discipline_score > 10:
                risk_factors.append("Disciplinary issues")
            if risk.assignment_score > 5:
                risk_factors.append("Poor assignment submission")
            if risk.activity_score > 5:
                risk_factors.append("Low participation")
        
        # Apply risk level filter if specified
        if risk_level and risk:
            if risk.risk_level != risk_level:
                continue
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            if search_lower not in student.name.lower() and search_lower not in student.roll_number.lower():
                continue
        
        student_data = StudentWithRisk(
            id=student.id,
            name=student.name,
            email=student.email,
            roll_number=student.roll_number,
            department=student.department,
            section=student.section,
            year=student.year,
            mentor_id=student.mentor_id,
            risk_score=risk.total_score if risk else None,
            risk_level=risk.risk_level if risk else "LOW",
            attendance_percentage=avg_attendance,
            average_grade=avg_grade,
            disciplinary_count=disciplinary_count,
            activity_count=activity_count,
            risk_factors=risk_factors
        )
        result.append(student_data)
    
    return result

@app.get("/students/{student_id}", response_model=StudentWithRisk)
def get_student_by_id(student_id: int, db: Session = Depends(get_db)):
    """Get a specific student with all their data"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get latest risk flag
    risk = db.query(RiskFlag).filter(RiskFlag.student_id == student.id).order_by(RiskFlag.created_at.desc()).first()
    
    # Get attendance
    attendance_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
    
    # Get grades
    grade_records = db.query(Grade).filter(Grade.student_id == student.id).all()
    avg_grade = sum(g.marks for g in grade_records) / len(grade_records) if grade_records else 0
    
    # Get counts
    disciplinary_count = db.query(DisciplinaryRecord).filter(DisciplinaryRecord.student_id == student.id).count()
    activity_count = db.query(Activity).filter(Activity.student_id == student.id).count()
    
    # Get risk factors
    risk_factors = []
    if risk:
        if risk.attendance_score > 20:
            risk_factors.append("Low attendance")
        if risk.academic_score > 20:
            risk_factors.append("Poor academic performance")
        if risk.discipline_score > 10:
            risk_factors.append("Disciplinary issues")
        if risk.assignment_score > 5:
            risk_factors.append("Poor assignment submission")
        if risk.activity_score > 5:
            risk_factors.append("Low participation")
    
    return StudentWithRisk(
        id=student.id,
        name=student.name,
        email=student.email,
        roll_number=student.roll_number,
        department=student.department,
        section=student.section,
        year=student.year,
        mentor_id=student.mentor_id,
        risk_score=risk.total_score if risk else None,
        risk_level=risk.risk_level if risk else "LOW",
        attendance_percentage=avg_attendance,
        average_grade=avg_grade,
        disciplinary_count=disciplinary_count,
        activity_count=activity_count,
        risk_factors=risk_factors
    )

# ==================== STUDENT DETAILS ENDPOINTS ====================

@app.get("/students/{student_id}/attendance", response_model=List[dict])
def get_student_attendance(student_id: int, db: Session = Depends(get_db)):
    """Get attendance records for a student"""
    records = db.query(Attendance).filter(Attendance.student_id == student_id).order_by(Attendance.date).all()
    return [
        {
            "month": r.month,
            "date": r.date,
            "attendance_percentage": r.attendance_percentage
        }
        for r in records
    ]

@app.get("/students/{student_id}/grades", response_model=List[dict])
def get_student_grades(student_id: int, db: Session = Depends(get_db)):
    """Get grades for a student"""
    records = db.query(Grade).filter(Grade.student_id == student_id).all()
    return [
        {
            "subject": r.subject,
            "marks": r.marks,
            "exam_type": r.exam_type
        }
        for r in records
    ]

@app.get("/students/{student_id}/notes", response_model=List[MentorNoteSchema])
def get_student_notes(student_id: int, db: Session = Depends(get_db)):
    """Get mentor notes for a student"""
    notes = db.query(MentorNote).filter(MentorNote.student_id == student_id).order_by(MentorNote.date.desc()).all()
    return notes

@app.get("/students/{student_id}/activities", response_model=List[dict])
def get_student_activities(student_id: int, db: Session = Depends(get_db)):
    """Get activities for a student"""
    activities = db.query(Activity).filter(Activity.student_id == student_id).all()
    return [
        {
            "id": a.id,
            "activity_name": a.activity_name,
            "date": a.date,
            "category": "General"
        }
        for a in activities
    ]

@app.post("/students/{student_id}/activities")
def add_student_activity(
    student_id: int,
    activity_data: dict,
    db: Session = Depends(get_db)
):
    """Add a new activity for a student"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    activity = Activity(
        student_id=student_id,
        activity_name=activity_data.get("activity_name"),
        date=date.today()
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return {"message": "Activity added successfully", "activity": activity}

# ==================== MENTOR NOTE ENDPOINTS ====================

@app.post("/students/{student_id}/notes", response_model=MentorNoteSchema)
def add_mentor_note(
    student_id: int,
    note_data: MentorNoteCreate,
    db: Session = Depends(get_db)
):
    """Add a mentor note for a student"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create note
    note = MentorNote(
        student_id=student_id,
        mentor_id=note_data.mentor_id,
        note=note_data.note,
        action_taken=note_data.action_taken,
        follow_up_date=note_data.follow_up_date,
        date=datetime.now()
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

# ==================== RISK ENDPOINTS ====================

@app.get("/students/{student_id}/risk")
def get_student_risk(student_id: int, db: Session = Depends(get_db)):
    """Get risk data for a student with explanation"""
    risk = db.query(RiskFlag).filter(RiskFlag.student_id == student_id).order_by(RiskFlag.created_at.desc()).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk data not found")
    
    # Get student name
    student = db.query(Student).filter(Student.id == student_id).first()
    
    # Build explanation
    explanation = []
    if risk.attendance_score > 20:
        explanation.append(f"Attendance below 75% - Score: {risk.attendance_score:.1f}/30")
    if risk.academic_score > 20:
        explanation.append(f"Low academic performance - Score: {risk.academic_score:.1f}/30")
    if risk.discipline_score > 10:
        explanation.append(f"Multiple disciplinary records - Score: {risk.discipline_score:.1f}/20")
    if risk.assignment_score > 5:
        explanation.append(f"Poor assignment submission - Score: {risk.assignment_score:.1f}/10")
    if risk.activity_score > 5:
        explanation.append(f"Low extracurricular participation - Score: {risk.activity_score:.1f}/10")
    
    return {
        "student_name": student.name if student else "Unknown",
        "total_score": risk.total_score,
        "risk_level": risk.risk_level,
        "attendance_score": risk.attendance_score,
        "academic_score": risk.academic_score,
        "discipline_score": risk.discipline_score,
        "assignment_score": risk.assignment_score,
        "activity_score": risk.activity_score,
        "explanation": explanation,
        "recommendation": get_recommendation(risk.risk_level, explanation)
    }

def get_recommendation(risk_level: str, factors: list) -> str:
    """Generate recommendation based on risk level and factors"""
    if risk_level == "HIGH":
        return "Schedule immediate mentor counseling session. Create personalized improvement plan with focus on attendance and academics. Meet weekly to track progress."
    elif risk_level == "MEDIUM":
        return "Schedule mentor meeting. Monitor progress monthly. Encourage participation in extracurricular activities."
    else:
        return "Continue good performance. Maintain regular check-ins to ensure student stays on track."

# ==================== DASHBOARD ENDPOINTS ====================

@app.get("/dashboard/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    student_id: Optional[int] = None
):
    """Get dashboard summary statistics"""
    
    # If student_id is provided, get student data
    if student_id:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return {
                "total_students": 0,
                "high_risk": 0,
                "medium_risk": 0,
                "low_risk": 0,
                "average_attendance": 0,
                "average_grade": 0,
                "departments": [],
                "risk_level": "N/A"
            }
        
        # Get student's risk - get the LATEST one
        risk = db.query(RiskFlag).filter(RiskFlag.student_id == student_id).order_by(RiskFlag.created_at.desc()).first()
        
        # Get student's attendance
        attendance_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
        avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
        
        # Get student's grades
        grade_records = db.query(Grade).filter(Grade.student_id == student_id).all()
        avg_grade = sum(g.marks for g in grade_records) / len(grade_records) if grade_records else 0
        
        # Determine risk counts
        high_risk = 1 if risk and risk.risk_level == "HIGH" else 0
        medium_risk = 1 if risk and risk.risk_level == "MEDIUM" else 0
        low_risk = 1 if risk and risk.risk_level == "LOW" else 0
        
        # Get risk level - default to "LOW" if no risk data
        risk_level = risk.risk_level if risk else "LOW"
        
        return {
            "total_students": 1,
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
            "average_attendance": avg_attendance,
            "average_grade": avg_grade,
            "departments": [student.department],
            "risk_level": risk_level
        }
    
    # For admin/mentor, show all data
    total_students = db.query(Student).count()
    
    if total_students == 0:
        return {
            "total_students": 0,
            "high_risk": 0,
            "medium_risk": 0,
            "low_risk": 0,
            "average_attendance": 0,
            "average_grade": 0,
            "departments": [],
            "risk_level": None
        }
    
    # Risk counts
    high_risk = db.query(RiskFlag).filter(RiskFlag.risk_level == "HIGH").count()
    medium_risk = db.query(RiskFlag).filter(RiskFlag.risk_level == "MEDIUM").count()
    low_risk = db.query(RiskFlag).filter(RiskFlag.risk_level == "LOW").count()
    
    # Average attendance
    attendance_records = db.query(Attendance).all()
    avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
    
    # Average grade
    grade_records = db.query(Grade).all()
    avg_grade = sum(g.marks for g in grade_records) / len(grade_records) if grade_records else 0
    
    # Departments
    departments = [d[0] for d in db.query(Student.department).distinct().all()]
    
    return {
        "total_students": total_students,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "low_risk": low_risk,
        "average_attendance": avg_attendance,
        "average_grade": avg_grade,
        "departments": departments,
        "risk_level": None
    }

@app.get("/dashboard/at-risk")
def get_at_risk_students(db: Session = Depends(get_db)):
    """Get all at-risk students with details"""
    try:
        risk_students = db.query(Student, RiskFlag).join(RiskFlag).filter(
            RiskFlag.risk_level.in_(["HIGH", "MEDIUM"])
        ).order_by(RiskFlag.total_score.desc()).all()
        
        result = []
        for student, risk in risk_students:
            # Get attendance and grades
            attendance_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
            avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
            
            grade_records = db.query(Grade).filter(Grade.student_id == student.id).all()
            avg_grade = sum(g.marks for g in grade_records) / len(grade_records) if grade_records else 0
            
            result.append({
                "id": student.id,
                "name": student.name,
                "roll_number": student.roll_number,
                "department": student.department,
                "section": student.section,
                "year": student.year,
                "attendance": avg_attendance,
                "average_grade": avg_grade,
                "risk_score": risk.total_score,
                "risk_level": risk.risk_level,
                "risk_factors": [
                    "Attendance" if risk.attendance_score > 20 else None,
                    "Academics" if risk.academic_score > 20 else None,
                    "Discipline" if risk.discipline_score > 10 else None,
                    "Assignments" if risk.assignment_score > 5 else None,
                    "Participation" if risk.activity_score > 5 else None
                ]
            })
        
        return result
    except Exception as e:
        print(f"Error in at-risk endpoint: {e}")
        return []

# ==================== STUDENT SELF-SERVICE ENDPOINT ====================

@app.get("/student/my-data")
def get_my_data(student_id: int, db: Session = Depends(get_db)):
    """Get current student's own data (for student role)"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get latest risk flag
    risk = db.query(RiskFlag).filter(RiskFlag.student_id == student_id).order_by(RiskFlag.created_at.desc()).first()
    
    # Get attendance
    attendance_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
    
    # Get grades
    grade_records = db.query(Grade).filter(Grade.student_id == student_id).all()
    avg_grade = sum(g.marks for g in grade_records) / len(grade_records) if grade_records else 0
    
    # Get counts
    disciplinary_count = db.query(DisciplinaryRecord).filter(DisciplinaryRecord.student_id == student_id).count()
    activity_count = db.query(Activity).filter(Activity.student_id == student_id).count()
    
    # Get risk factors
    risk_factors = []
    if risk:
        if risk.attendance_score > 20:
            risk_factors.append("Low attendance")
        if risk.academic_score > 20:
            risk_factors.append("Poor academic performance")
        if risk.discipline_score > 10:
            risk_factors.append("Disciplinary issues")
        if risk.assignment_score > 5:
            risk_factors.append("Poor assignment submission")
        if risk.activity_score > 5:
            risk_factors.append("Low participation")
    
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "roll_number": student.roll_number,
        "department": student.department,
        "section": student.section,
        "year": student.year,
        "mentor_id": student.mentor_id,
        "risk_score": risk.total_score if risk else None,
        "risk_level": risk.risk_level if risk else "LOW",
        "attendance_percentage": avg_attendance,
        "average_grade": avg_grade,
        "disciplinary_count": disciplinary_count,
        "activity_count": activity_count,
        "risk_factors": risk_factors
    }
# ==================== DELETE STUDENT ====================

@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """Delete a student and all associated data"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    try:
        # Delete associated data first (cascade will handle if set up)
        db.query(RiskFlag).filter(RiskFlag.student_id == student_id).delete()
        db.query(Attendance).filter(Attendance.student_id == student_id).delete()
        db.query(Grade).filter(Grade.student_id == student_id).delete()
        db.query(DisciplinaryRecord).filter(DisciplinaryRecord.student_id == student_id).delete()
        db.query(Activity).filter(Activity.student_id == student_id).delete()
        db.query(MentorNote).filter(MentorNote.student_id == student_id).delete()
        
        # Delete the student
        db.delete(student)
        db.commit()
        
        return {"message": f"Student {student.name} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting student: {str(e)}")

# ==================== ADD STUDENT ====================

@app.post("/students")
def add_student(student_data: dict, db: Session = Depends(get_db)):
    """Add a new student"""
    # Check if email already exists
    existing_email = db.query(Student).filter(Student.email == student_data.get("email")).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Check if roll number already exists
    existing_roll = db.query(Student).filter(Student.roll_number == student_data.get("roll_number")).first()
    if existing_roll:
        raise HTTPException(status_code=400, detail="Roll number already exists")
    
    try:
        new_student = Student(
            name=student_data.get("name"),
            email=student_data.get("email"),
            roll_number=student_data.get("roll_number"),
            department=student_data.get("department"),
            section=student_data.get("section", "A"),
            year=student_data.get("year", 1),
            mentor_id=student_data.get("mentor_id", 1)
        )
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        
        # Create default risk flag for new student (LOW risk)
        risk_flag = RiskFlag(
            student_id=new_student.id,
            attendance_score=5.0,
            academic_score=5.0,
            discipline_score=0.0,
            assignment_score=2.0,
            activity_score=2.0,
            total_score=14.0,
            risk_level="LOW",
            created_at=datetime.now()
        )
        db.add(risk_flag)
        db.commit()
        
        # Create default attendance records
        for month in ["January", "February", "March"]:
            attendance = Attendance(
                student_id=new_student.id,
                attendance_percentage=85.0,
                month=month,
                date=date.today()
            )
            db.add(attendance)
        db.commit()
        
        # Create default grades
        subjects = ["Mathematics", "Physics", "Chemistry", "English", "Computer Science"]
        for subject in subjects:
            grade = Grade(
                student_id=new_student.id,
                subject=subject,
                marks=75.0,
                exam_type="Mid-term"
            )
            db.add(grade)
        db.commit()
        
        return {
            "message": f"Student {new_student.name} added successfully",
            "student": {
                "id": new_student.id,
                "name": new_student.name,
                "email": new_student.email,
                "roll_number": new_student.roll_number,
                "department": new_student.department,
                "risk_level": "LOW"
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding student: {str(e)}")

# ==================== AI PREDICTION ENDPOINT ====================

@app.get("/students/{student_id}/predict")
def predict_risk(student_id: int, db: Session = Depends(get_db)):
    """
    AI-based risk prediction for a student
    Uses machine learning to predict if student might become HIGH risk
    """
    # Get student data
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get attendance
    attendance_records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
    
    # Get grades
    grade_records = db.query(Grade).filter(Grade.student_id == student_id).all()
    avg_grade = sum(g.marks for g in grade_records) / len(grade_records) if grade_records else 0
    
    # Get counts
    disciplinary_count = db.query(DisciplinaryRecord).filter(DisciplinaryRecord.student_id == student_id).count()
    activity_count = db.query(Activity).filter(Activity.student_id == student_id).count()
    
    # Get current risk
    current_risk = db.query(RiskFlag).filter(RiskFlag.student_id == student_id).order_by(RiskFlag.created_at.desc()).first()
    
    # Prepare features
    features = np.array([[avg_attendance, avg_grade, disciplinary_count, activity_count]])
    
    # Make prediction
    if model_loaded:
        prediction = ai_model.predict(features)[0]
        proba = ai_model.predict_proba(features)[0]
        
        risk_mapping = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
        predicted_risk = risk_mapping[prediction]
        confidence = max(proba) * 100
        
        # Calculate risk of becoming HIGH
        high_risk_prob = proba[2] * 100
    else:
        predicted_risk = "LOW"
        confidence = 70
        high_risk_prob = 0
    
    # Generate recommendation
    if high_risk_prob > 60:
        recommendation = "⚠️ HIGH RISK ALERT: Student has a high probability of becoming HIGH risk. Schedule immediate counseling."
        action = "Schedule weekly counseling sessions, create attendance improvement plan, notify parents."
    elif high_risk_prob > 30:
        recommendation = "📊 MEDIUM RISK WARNING: Student shows some risk indicators. Monitor closely."
        action = "Schedule monthly check-ins, monitor attendance and grades, encourage participation in activities."
    else:
        recommendation = "✅ LOW RISK: Student appears to be on track. Continue regular monitoring."
        action = "Continue regular check-ins, maintain current performance, encourage extracurricular activities."
    
    return {
        "student_id": student_id,
        "student_name": student.name,
        "current_risk": current_risk.risk_level if current_risk else "UNKNOWN",
        "predicted_risk": predicted_risk,
        "confidence": f"{confidence:.1f}%",
        "high_risk_probability": f"{high_risk_prob:.1f}%",
        "features_used": {
            "attendance": round(avg_attendance, 1),
            "grade": round(avg_grade, 1),
            "disciplinary_count": disciplinary_count,
            "activity_count": activity_count
        },
        "recommendation": recommendation,
        "action_required": action,
        "explanation": "AI model analyzed attendance, grades, disciplinary records, and activities to predict future risk."
    }

@app.get("/ai/feature-importance")
def get_feature_importance():
    """Get which factors are most important for AI predictions"""
    if not model_loaded:
        return {"error": "Model not loaded"}
    
    importances = ai_model.feature_importances_
    feature_names = ["Attendance", "Grade", "Disciplinary Count", "Activity Count"]
    
    return {
        "features": [
            {"name": name, "importance": f"{imp:.2%}"}
            for name, imp in zip(feature_names, importances)
        ]
    }

@app.get("/ai/predict-all")
def predict_all_students(db: Session = Depends(get_db)):
    """Predict risk for ALL students and identify those at highest risk"""
    students = db.query(Student).all()
    results = []
    
    for student in students:
        # Get data
        attendance_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
        
        grade_records = db.query(Grade).filter(Grade.student_id == student.id).all()
        avg_grade = sum(g.marks for g in grade_records) / len(grade_records) if grade_records else 0
        
        disciplinary_count = db.query(DisciplinaryRecord).filter(DisciplinaryRecord.student_id == student.id).count()
        activity_count = db.query(Activity).filter(Activity.student_id == student.id).count()
        
        # Get current risk
        current_risk = db.query(RiskFlag).filter(RiskFlag.student_id == student.id).order_by(RiskFlag.created_at.desc()).first()
        
        # Predict
        features = np.array([[avg_attendance, avg_grade, disciplinary_count, activity_count]])
        
        if model_loaded:
            prediction = ai_model.predict(features)[0]
            proba = ai_model.predict_proba(features)[0]
            risk_mapping = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
            predicted_risk = risk_mapping[prediction]
            high_risk_prob = proba[2] * 100
        else:
            predicted_risk = "LOW"
            high_risk_prob = 0
        
        results.append({
            "id": student.id,
            "name": student.name,
            "roll_number": student.roll_number,
            "current_risk": current_risk.risk_level if current_risk else "UNKNOWN",
            "predicted_risk": predicted_risk,
            "high_risk_probability": round(high_risk_prob, 1)
        })
    
    # Sort by high risk probability (highest first)
    results.sort(key=lambda x: x["high_risk_probability"], reverse=True)
    
    return {
        "total_students": len(results),
        "high_risk_predictions": [r for r in results if r["high_risk_probability"] > 60],
        "all_predictions": results
    }