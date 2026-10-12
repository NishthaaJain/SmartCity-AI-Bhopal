import datetime
from sqlalchemy.orm import Session
from app.models import Department, Complaint

CATEGORY_TO_DEPT_CODE = {
    "Road / Pothole": "ROADS",
    "Garbage / Waste": "WASTE",
    "Water Supply": "WATER",
    "Streetlight / Electricity": "ELECTRICAL",
    "Drainage": "DRAINAGE",
    "Traffic Signal": "TRAFFIC",
    "Public Infrastructure": "GENERAL",
    "Other": "GENERAL"
}

SLA_HOURS = {
    "Critical": 24,
    "High": 48,
    "Medium": 72,   # 3 days
    "Low": 168      # 7 days
}

def get_department_for_category(category: str, db: Session) -> Department:
    """Finds matching Department ORM instance for a given complaint category."""
    code = CATEGORY_TO_DEPT_CODE.get(category, "GENERAL")
    dept = db.query(Department).filter(Department.code == code).first()
    if not dept:
        # Fallback to first available department or GENERAL
        dept = db.query(Department).first()
    return dept

def calculate_sla_due_date(priority: str, start_time: datetime.datetime = None) -> datetime.datetime:
    """Calculates SLA due date based on priority."""
    if start_time is None:
        start_time = datetime.datetime.utcnow()
    hours = SLA_HOURS.get(priority, 72)
    return start_time + datetime.timedelta(hours=hours)

def is_complaint_overdue(complaint: Complaint) -> bool:
    """Dynamically calculates if a complaint is overdue."""
    if not complaint.sla_due_at:
        return False
    if complaint.status in ["Resolved", "Closed"]:
        return False
    return datetime.datetime.utcnow() > complaint.sla_due_at
