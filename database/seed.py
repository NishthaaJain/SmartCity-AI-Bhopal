import os
import sys
import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database import SessionLocal, engine, Base
from app.models import Department, User, Complaint, ComplaintUpdate, Notification
from app.auth import hash_password
from app.routing import calculate_sla_due_date

def seed_bhopal_database():
    print("Recreating database tables for Bhopal Civic System...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Department).count() > 0:
            print("Database already seeded with departments. Skipping.")
            return

        print("Seeding 7 Bhopal Municipal Departments...")
        departments_data = [
            {"name": "Roads & Public Works", "code": "ROADS", "description": "Handles road repairs, potholes, sidewalk infrastructure, and street construction in Bhopal."},
            {"name": "Waste Management", "code": "WASTE", "description": "Responsible for garbage collection, sanitation bins, waste disposal, and street cleaning."},
            {"name": "Water Supply", "code": "WATER", "description": "Manages drinking water supply pipelines, leakage repairs, and water distribution."},
            {"name": "Electrical / Streetlight", "code": "ELECTRICAL", "description": "Maintains street lighting poles, public electrical wiring, and transformer safety."},
            {"name": "Drainage", "code": "DRAINAGE", "description": "Oversees sewer mains, storm drains, manhole covers, and rainwater drainage."},
            {"name": "Traffic / Signals", "code": "TRAFFIC", "description": "Manages traffic signals, pedestrian crossings, road safety signages, and junction lights."},
            {"name": "General Civic Administration", "code": "GENERAL", "description": "Handles miscellaneous public infrastructure, parks, and general municipal issues."}
        ]

        depts_dict = {}
        for item in departments_data:
            dept = Department(**item)
            db.add(dept)
            db.commit()
            db.refresh(dept)
            depts_dict[dept.code] = dept

        print("Seeding Bhopal System Users (Super Admin, Dept Admins, Citizen)...")
        super_admin = User(
            name="Bhopal Municipal Super Admin",
            email="superadmin@bhopal.gov.in",
            password_hash=hash_password("Admin@123"),
            role="SUPER_ADMIN",
            department_id=None
        )

        roads_admin = User(
            name="Roads Dept Officer",
            email="roads.admin@bhopal.gov.in",
            password_hash=hash_password("Admin@123"),
            role="DEPARTMENT_ADMIN",
            department_id=depts_dict["ROADS"].id
        )

        waste_admin = User(
            name="Sanitation Officer",
            email="waste.admin@bhopal.gov.in",
            password_hash=hash_password("Admin@123"),
            role="DEPARTMENT_ADMIN",
            department_id=depts_dict["WASTE"].id
        )

        water_admin = User(
            name="Water Works Engineer",
            email="water.admin@bhopal.gov.in",
            password_hash=hash_password("Admin@123"),
            role="DEPARTMENT_ADMIN",
            department_id=depts_dict["WATER"].id
        )

        citizen = User(
            name="Rajesh Sharma (Resident)",
            email="citizen@bhopal.org",
            password_hash=hash_password("Citizen@123"),
            role="CITIZEN",
            department_id=None
        )

        db.add_all([super_admin, roads_admin, waste_admin, water_admin, citizen])
        db.commit()
        db.refresh(citizen)
        db.refresh(roads_admin)
        db.refresh(waste_admin)

        print("Seeding sample Bhopal civic complaints...")
        now = datetime.datetime.utcnow()

        complaints = [
            {
                "citizen_id": citizen.id,
                "department_id": depts_dict["ROADS"].id,
                "title": "Dangerous Deep Pothole on Main Road",
                "description": "A huge deep pothole has formed right in front of Zone 1 market complex. Two two-wheelers nearly lost balance today.",
                "category": "Road / Pothole",
                "location": "MP Nagar Zone 1",
                "priority": "High",
                "status": "In Progress",
                "ai_suggested_category": "Road / Pothole",
                "rule_suggested_priority": "High",
                "ai_reasoning": "Significant public safety risk or major infrastructure obstruction.",
                "sla_due_at": calculate_sla_due_date("High", now - datetime.timedelta(hours=12))
            },
            {
                "citizen_id": citizen.id,
                "department_id": depts_dict["WASTE"].id,
                "title": "Overflowing Garbage Bin near Bus Stand",
                "description": "Garbage collection bin is overflowing onto the main pavement. Foul odor and flies accumulating for 2 days.",
                "category": "Garbage / Waste",
                "location": "New Market Bus Stand",
                "priority": "Medium",
                "status": "Under Review",
                "ai_suggested_category": "Garbage / Waste",
                "rule_suggested_priority": "Medium",
                "ai_reasoning": "Public sanitation concern requiring scheduled collection.",
                "sla_due_at": calculate_sla_due_date("Medium", now)
            },
            {
                "citizen_id": citizen.id,
                "department_id": depts_dict["WATER"].id,
                "title": "Pipeline Leak Waste Clean Water",
                "description": "Clean drinking water supply pipe has burst near residential entrance gate 3.",
                "category": "Water Supply",
                "location": "Arera Colony E-7",
                "priority": "High",
                "status": "Submitted",
                "ai_suggested_category": "Water Supply",
                "rule_suggested_priority": "High",
                "ai_reasoning": "Public essential utility outage affecting household health.",
                "sla_due_at": calculate_sla_due_date("High", now)
            },
            {
                "citizen_id": citizen.id,
                "department_id": depts_dict["ELECTRICAL"].id,
                "title": "Dark Street Lights Outage",
                "description": "All 5 street lights are dark along the main connecting road near Kolar square.",
                "category": "Streetlight / Electricity",
                "location": "Kolar Road Square",
                "priority": "Medium",
                "status": "Resolved",
                "ai_suggested_category": "Streetlight / Electricity",
                "rule_suggested_priority": "Medium",
                "ai_reasoning": "Street lighting failure creating night safety vulnerability.",
                "resolution_remark": "Electrical team replaced blown fuse and restored all 5 street lamps.",
                "resolved_at": now - datetime.timedelta(hours=4),
                "sla_due_at": calculate_sla_due_date("Medium", now - datetime.timedelta(days=2))
            },
            {
                "citizen_id": citizen.id,
                "department_id": depts_dict["WASTE"].id,
                "title": "Waste Dumped Near Lake Walkway",
                "description": "Plastic trash and construction debris dumped by side of lake road.",
                "category": "Garbage / Waste",
                "location": "Shahpura Lake Promenade",
                "priority": "Medium",
                "status": "Reopened",
                "ai_suggested_category": "Garbage / Waste",
                "rule_suggested_priority": "Medium",
                "ai_reasoning": "Public sanitation concern requiring scheduled collection.",
                "resolution_remark": "Cleaned main container.",
                "resolved_at": now - datetime.timedelta(days=1),
                "sla_due_at": calculate_sla_due_date("Medium", now - datetime.timedelta(days=3))
            }
        ]

        for item in complaints:
            c = Complaint(**item)
            db.add(c)
            db.commit()
            db.refresh(c)

            # Create initial update log
            update = ComplaintUpdate(
                complaint_id=c.id,
                user_id=citizen.id,
                status=c.status,
                message=f"Complaint registered and routed to {c.department.name}."
            )
            db.add(update)
            db.commit()

        print(f"Successfully seeded database with {len(complaints)} Bhopal complaints!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_bhopal_database()
