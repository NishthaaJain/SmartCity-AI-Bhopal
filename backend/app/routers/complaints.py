import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Complaint, User, ComplaintUpdate
from app.schemas import ComplaintOut, ComplaintCreate, ComplaintReopenRequest, DuplicateCheckRequest
from app.auth import get_current_user
from app.ml_service import ml_service
from app.priority_engine import evaluate_rule_priority
from app.routing import get_department_for_category, calculate_sla_due_date
from app.duplicate_check import check_duplicate_complaints
from app.config import settings


router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    title: str = Form(...),
    description: str = Form(...),
    category: Optional[str] = Form(None),
    location: str = Form(...),
    zone: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Category Prediction
    predicted_category, confidence = ml_service.predict_category(description)
    final_category = category if (category and category != "Auto-detect") else predicted_category

    # Priority Scoring (Rule-based)
    priority, ai_reasoning = evaluate_rule_priority(description, final_category)

    # Department Routing
    dept = get_department_for_category(final_category, db)
    if not dept:
        raise HTTPException(status_code=400, detail="Invalid category mapping. Department could not be assigned.")

    # SLA Calculation
    sla_due = calculate_sla_due_date(priority)

    # Photo file upload handling
    photo_path = None
    if photo and photo.filename:
        ext = os.path.splitext(photo.filename)[1]
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            content = await photo.read()
            buffer.write(content)
        photo_path = f"/uploads/{filename}"

    complaint = Complaint(
        citizen_id=current_user.id,
        department_id=dept.id,
        title=title,
        description=description,
        category=final_category,
        ai_suggested_category=predicted_category,
        rule_suggested_priority=priority,
        ai_reasoning=ai_reasoning,
        priority=priority,
        status="Submitted",
        location=location,
        photo_path=photo_path,
        sla_due_at=sla_due
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    update = ComplaintUpdate(
        complaint_id=complaint.id,
        user_id=current_user.id,
        status="Submitted",
        message="Complaint registered and routed to department."
    )
    db.add(update)
    
    # Notify Citizen

    
    db.commit()

    out = ComplaintOut.from_orm(complaint)
    out.user_name = current_user.name
    out.user_email = current_user.email
    out.predicted_category = complaint.ai_suggested_category
    out.zone = zone
    return out

@router.post("/check-duplicate")
def check_duplicate(
    payload: DuplicateCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    duplicates = check_duplicate_complaints(payload.description, payload.category, payload.location, db)
    return {"duplicates": duplicates}

@router.get("", response_model=List[ComplaintOut])
def get_user_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).filter(Complaint.citizen_id == current_user.id).order_by(Complaint.created_at.desc()).all()
    results = []
    for c in complaints:
        out = ComplaintOut.from_orm(c)
        out.user_name = current_user.name
        out.user_email = current_user.email
        out.predicted_category = c.ai_suggested_category
        results.append(out)
    return results

@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint_by_id(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == "CITIZEN" and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this complaint")
    
    if current_user.role == "DEPARTMENT_ADMIN" and complaint.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Not authorized. This complaint belongs to another department.")

    out = ComplaintOut.from_orm(complaint)
    out.predicted_category = complaint.ai_suggested_category
    
    user = db.query(User).filter(User.id == complaint.citizen_id).first()
    if user:
        out.user_name = user.name
        out.user_email = user.email
    return out

@router.post("/{complaint_id}/reopen", response_model=ComplaintOut)
def reopen_complaint(
    complaint_id: int,
    payload: ComplaintReopenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if current_user.role != "CITIZEN" or complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the citizen who created this complaint can reopen it")
        
    if complaint.status != "Resolved":
        raise HTTPException(status_code=400, detail="Only resolved complaints can be reopened")

    complaint.status = "Reopened"
    db.commit()
    db.refresh(complaint)

    update = ComplaintUpdate(
        complaint_id=complaint.id,
        user_id=current_user.id,
        status="Reopened",
        message=f"Citizen reopened: {payload.remark}"
    )
    db.add(update)

    db.commit()

    out = ComplaintOut.from_orm(complaint)
    out.predicted_category = complaint.ai_suggested_category
    out.user_name = current_user.name
    out.user_email = current_user.email
    return out
