from database import engine, Base
from models import Student, Attendance, Grade, DisciplinaryRecord, Activity, MentorNote, RiskFlag

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")