from typing import List
from sqlalchemy.orm import Session
from app.models import Complaint

def check_duplicate_complaints(description: str, category: str, location: str, db: Session) -> List[dict]:
    """
    Lightweight duplicate check scanning active open complaints matching category & area.
    Returns list of matching potential duplicate complaints for citizen warning.
    """
    if not description or len(description.strip()) < 5:
        return []

    # Active complaints are those not Resolved or Closed
    open_complaints = db.query(Complaint).filter(
        Complaint.status.notin_(["Resolved", "Closed"])
    ).all()

    desc_words = set(w.lower() for w in description.split() if len(w) > 3)
    loc_lower = location.lower().strip()

    duplicates = []
    for c in open_complaints:
        # Match category OR location
        loc_match = loc_lower in c.location.lower() or c.location.lower() in loc_lower
        cat_match = c.category == category

        # Word overlap
        c_words = set(w.lower() for w in c.description.split() if len(w) > 3)
        common_words = desc_words.intersection(c_words)
        similarity = len(common_words) / max(1, len(desc_words))

        if (cat_match and loc_match) or (similarity >= 0.4 and loc_match):
            duplicates.append({
                "id": c.id,
                "title": c.title,
                "description": c.description[:120] + "..." if len(c.description) > 120 else c.description,
                "location": c.location,
                "category": c.category,
                "status": c.status,
                "created_at": c.created_at.strftime("%d %b %Y")
            })

    return duplicates[:3] # Limit to top 3 potential duplicates
