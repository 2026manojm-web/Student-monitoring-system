from database import SessionLocal
from models import Student, Attendance, Grade, DisciplinaryRecord, Activity, RiskFlag
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pandas as pd
import numpy as np
import joblib

print("🔮 Training AI Risk Prediction Model...")

db = SessionLocal()

# Get all students with their data
students = db.query(Student).all()

# Prepare data for training
data = []
for student in students:
    # Get attendance data
    attendance_records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if len(attendance_records) == 0:
        continue
    
    avg_attendance = sum(a.attendance_percentage for a in attendance_records) / len(attendance_records)
    
    # Get grade data
    grade_records = db.query(Grade).filter(Grade.student_id == student.id).all()
    if len(grade_records) == 0:
        continue
    
    avg_grade = sum(g.marks for g in grade_records) / len(grade_records)
    
    # Get counts
    disciplinary_count = db.query(DisciplinaryRecord).filter(DisciplinaryRecord.student_id == student.id).count()
    activity_count = db.query(Activity).filter(Activity.student_id == student.id).count()
    
    # Get risk flag
    risk = db.query(RiskFlag).filter(RiskFlag.student_id == student.id).order_by(RiskFlag.created_at.desc()).first()
    if not risk:
        continue
    
    # Features: [attendance, grade, disciplinary_count, activity_count]
    # Target: risk_level (0=LOW, 1=MEDIUM, 2=HIGH)
    features = [
        avg_attendance,
        avg_grade,
        disciplinary_count,
        activity_count
    ]
    
    risk_mapping = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    target = risk_mapping[risk.risk_level]
    
    data.append({
        "attendance": avg_attendance,
        "grade": avg_grade,
        "disciplinary_count": disciplinary_count,
        "activity_count": activity_count,
        "risk_level": target
    })

db.close()

# Create DataFrame
df = pd.DataFrame(data)

print(f"📊 Training data: {len(df)} students")

# Split features and target
X = df[["attendance", "grade", "disciplinary_count", "activity_count"]]
y = df["risk_level"]

# Train/Test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest model
print("🧠 Training Random Forest model...")
model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
model.fit(X_train, y_train)

# Test accuracy
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"✅ Model trained! Accuracy: {accuracy:.2%}")

# Save model
joblib.dump(model, "risk_prediction_model.pkl")
print("💾 Model saved as 'risk_prediction_model.pkl'")

# Feature importance
importances = model.feature_importances_
feature_names = ["Attendance", "Grade", "Disciplinary Count", "Activity Count"]
print("\n📈 Feature Importance:")
for name, importance in zip(feature_names, importances):
    print(f"  {name}: {importance:.2%}")

print("\n🎯 Training Complete!")