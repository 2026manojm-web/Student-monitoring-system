from database import SessionLocal
from models import Student, Attendance, Grade, DisciplinaryRecord, Activity, RiskFlag
from datetime import datetime, date, timedelta
import random
from sqlalchemy import func

db = SessionLocal()

# Clear ALL existing data
print("Clearing existing data...")
db.query(RiskFlag).delete()
db.query(Attendance).delete()
db.query(Grade).delete()
db.query(DisciplinaryRecord).delete()
db.query(Activity).delete()
db.query(Student).delete()
db.commit()

print("Creating students with FORCED MIXED risk levels...")

# Students with FORCED risk levels and matching data
students_data = [
    # ===== HIGH RISK (10 students) =====
    {"name": "Rahul Krishnan", "roll": "S001", "risk": "HIGH", "attendance": 45, "grade": 42},
    {"name": "Divya", "roll": "S002", "risk": "HIGH", "attendance": 38, "grade": 35},
    {"name": "Vignesh", "roll": "S003", "risk": "HIGH", "attendance": 42, "grade": 38},
    {"name": "Prakash", "roll": "S004", "risk": "HIGH", "attendance": 50, "grade": 45},
    {"name": "Ganesh", "roll": "S005", "risk": "HIGH", "attendance": 35, "grade": 40},
    {"name": "Manoj", "roll": "S006", "risk": "HIGH", "attendance": 48, "grade": 32},
    {"name": "Suresh Kumar", "roll": "S007", "risk": "HIGH", "attendance": 40, "grade": 38},
    {"name": "Lakshmi Narayan", "roll": "S008", "risk": "HIGH", "attendance": 52, "grade": 42},
    {"name": "Karthikeyan", "roll": "S009", "risk": "HIGH", "attendance": 44, "grade": 36},
    {"name": "Selvi", "roll": "S010", "risk": "HIGH", "attendance": 46, "grade": 40},
    
    # ===== MEDIUM RISK (10 students) =====
    {"name": "Priya Sharma", "roll": "S011", "risk": "MEDIUM", "attendance": 72, "grade": 68},
    {"name": "Harish", "roll": "S012", "risk": "MEDIUM", "attendance": 68, "grade": 65},
    {"name": "Ananya", "roll": "S013", "risk": "MEDIUM", "attendance": 75, "grade": 62},
    {"name": "Naveen", "roll": "S014", "risk": "MEDIUM", "attendance": 70, "grade": 60},
    {"name": "Sowmya", "roll": "S015", "risk": "MEDIUM", "attendance": 65, "grade": 70},
    {"name": "Rajesh", "roll": "S016", "risk": "MEDIUM", "attendance": 73, "grade": 58},
    {"name": "Deepa", "roll": "S017", "risk": "MEDIUM", "attendance": 78, "grade": 66},
    {"name": "Kavya", "roll": "S018", "risk": "MEDIUM", "attendance": 66, "grade": 72},
    {"name": "Murali", "roll": "S019", "risk": "MEDIUM", "attendance": 74, "grade": 64},
    {"name": "Saranya", "roll": "S020", "risk": "MEDIUM", "attendance": 70, "grade": 62},
    
    # ===== LOW RISK (10 students) =====
    {"name": "Arun Kumar", "roll": "S021", "risk": "LOW", "attendance": 92, "grade": 88},
    {"name": "Karthik Raj", "roll": "S022", "risk": "LOW", "attendance": 88, "grade": 85},
    {"name": "Keerthana", "roll": "S023", "risk": "LOW", "attendance": 95, "grade": 92},
    {"name": "Suresh", "roll": "S024", "risk": "LOW", "attendance": 86, "grade": 82},
    {"name": "Meena", "roll": "S025", "risk": "LOW", "attendance": 90, "grade": 86},
    {"name": "Sathish", "roll": "S026", "risk": "LOW", "attendance": 88, "grade": 84},
    {"name": "Priya R", "roll": "S027", "risk": "LOW", "attendance": 93, "grade": 90},
    {"name": "Vijay", "roll": "S028", "risk": "LOW", "attendance": 85, "grade": 80},
    {"name": "Swathi", "roll": "S029", "risk": "LOW", "attendance": 91, "grade": 87},
    {"name": "Kumar", "roll": "S030", "risk": "LOW", "attendance": 94, "grade": 89},
]

subjects = ["Mathematics", "Physics", "Chemistry", "English", "Computer Science"]
exam_types = ["Mid-term", "Final", "Quiz", "Assignment"]
activities = ["Sports Day", "Cultural Fest", "Tech Symposium", "Debate", "Hackathon", "Workshop", "Music Club", "Drama Club"]
disciplinary_issues = ["Late to class", "Disruptive behavior", "Missing assignments", "Phone usage in class", "Poor attendance"]

for s_data in students_data:
    print(f"Creating {s_data['risk']} risk: {s_data['name']} (Attendance: {s_data['attendance']}%, Grade: {s_data['grade']}%)")
    
    # Create student
    student = Student(
        name=s_data["name"],
        email=f"{s_data['name'].lower().replace(' ', '.')}@example.com",
        roll_number=s_data["roll"],
        department=random.choice(["Computer Science", "Electronics", "Mechanical"]),
        section=random.choice(["A", "B"]),
        year=random.choice([1, 2, 3]),
        mentor_id=1
    )
    db.add(student)
    db.flush()
    
    # ===== ADD ATTENDANCE =====
    base_att = s_data["attendance"]
    for month in ["January", "February", "March"]:
        variation = random.randint(-5, 5)
        att_pct = max(0, min(100, base_att + variation))
        attendance = Attendance(
            student_id=student.id,
            attendance_percentage=att_pct,
            month=month,
            date=date(2026, 1, 1) + timedelta(days=random.randint(0, 90))
        )
        db.add(attendance)
    
    # ===== ADD GRADES =====
    base_grade = s_data["grade"]
    for subject in subjects:
        variation = random.randint(-8, 8)
        marks = max(0, min(100, base_grade + variation))
        grade = Grade(
            student_id=student.id,
            subject=subject,
            marks=marks,
            exam_type=random.choice(exam_types)
        )
        db.add(grade)
    
    # ===== ADD DISCIPLINARY RECORDS =====
    if s_data["risk"] == "HIGH":
        disc_count = random.randint(2, 4)
        chosen = random.sample(disciplinary_issues, min(disc_count, len(disciplinary_issues)))
        for issue in chosen:
            disc = DisciplinaryRecord(
                student_id=student.id,
                description=issue,
                date=date(2026, 1, 1) + timedelta(days=random.randint(0, 120))
            )
            db.add(disc)
    elif s_data["risk"] == "MEDIUM":
        disc_count = random.randint(0, 1)
        if disc_count > 0:
            disc = DisciplinaryRecord(
                student_id=student.id,
                description=random.choice(disciplinary_issues),
                date=date(2026, 1, 1) + timedelta(days=random.randint(0, 120))
            )
            db.add(disc)
    # LOW risk = no disciplinary records
    
    # ===== ADD ACTIVITIES =====
    if s_data["risk"] == "HIGH":
        act_count = random.randint(0, 1)
    elif s_data["risk"] == "MEDIUM":
        act_count = random.randint(1, 2)
    else:  # LOW
        act_count = random.randint(3, 5)
    
    if act_count > 0:
        chosen_activities = random.sample(activities, min(act_count, len(activities)))
        for act in chosen_activities:
            activity = Activity(
                student_id=student.id,
                activity_name=act,
                date=date(2026, 1, 1) + timedelta(days=random.randint(0, 120))
            )
            db.add(activity)
    
    # ===== FORCE THE RISK LEVEL =====
    # Set risk scores based on the FORCED risk level
    if s_data["risk"] == "HIGH":
        attendance_score = random.uniform(20, 30)
        academic_score = random.uniform(20, 30)
        discipline_score = random.uniform(10, 20)
        assignment_score = random.uniform(5, 10)
        activity_score = random.uniform(5, 10)
        total_score = random.uniform(65, 85)
    elif s_data["risk"] == "MEDIUM":
        attendance_score = random.uniform(10, 20)
        academic_score = random.uniform(10, 20)
        discipline_score = random.uniform(3, 10)
        assignment_score = random.uniform(3, 7)
        activity_score = random.uniform(3, 7)
        total_score = random.uniform(35, 55)
    else:  # LOW
        attendance_score = random.uniform(0, 10)
        academic_score = random.uniform(0, 10)
        discipline_score = random.uniform(0, 3)
        assignment_score = random.uniform(0, 3)
        activity_score = random.uniform(0, 3)
        total_score = random.uniform(5, 25)
    
    risk_flag = RiskFlag(
        student_id=student.id,
        attendance_score=attendance_score,
        academic_score=academic_score,
        discipline_score=discipline_score,
        assignment_score=assignment_score,
        activity_score=activity_score,
        total_score=total_score,
        risk_level=s_data["risk"],  # FORCE the risk level
        created_at=datetime.now()
    )
    db.add(risk_flag)

db.commit()

print("\n" + "="*60)
print("✅ MIXED RISK LEVELS CREATED SUCCESSFULLY!")
print("="*60)

# Verify the results
risk_counts = db.query(RiskFlag.risk_level, func.count(RiskFlag.id)).group_by(RiskFlag.risk_level).all()
print("\nRISK LEVELS SUMMARY:")
for level, count in risk_counts:
    print(f"  {level}: {count} students")

print("\n" + "="*60)
print("STUDENT LIST WITH ATTENDANCE, GRADES & RISK")
print("="*60)

students_with_data = db.query(Student, RiskFlag).join(RiskFlag).all()
for student, risk in students_with_data:
    attendance_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    grade_records = db.query(Grade).filter(Grade.student_id == student.id).all()
    
    avg_att = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records) if attendance_records else 0
    avg_grade = sum(g.marks for g in grade_records) / len(grade_records) if grade_records else 0
    
    # Color indicator
    color = "🔴" if risk.risk_level == "HIGH" else "🟡" if risk.risk_level == "MEDIUM" else "🟢"
    
    print(f"{color} {student.name:20} | Att: {avg_att:5.1f}% | Grade: {avg_grade:5.1f}% | Risk: {risk.risk_level:6} | Score: {risk.total_score:5.1f}")

print("\n" + "="*60)
print("✅ DONE! You should now see HIGH (🔴), MEDIUM (🟡), and LOW (🟢) risk students!")
print("="*60)

db.close()