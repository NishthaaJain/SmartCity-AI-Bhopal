from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.database import get_db
from app.models import Complaint, User, ComplaintUpdate, Department
from app.schemas import (ComplaintOut, ComplaintStatusUpdate, AdminAnalyticsResponse, 
                         DepartmentOut, ComplaintReassignRequest, ComplaintCategoryUpdateRequest, UserOut)
from app.auth import require_any_admin, require_super_admin


router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/complaints", response_model=List[ComplaintOut])
def list_all_complaints(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    admin_user: User = Depends(require_any_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint, User.name, User.email).join(User, Complaint.citizen_id == User.id)

    if admin_user.role == "DEPARTMENT_ADMIN":
        query = query.filter(Complaint.department_id == admin_user.department_id)

    if category:
        query = query.filter(Complaint.category == category)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if zone:
        query = query.filter(Complaint.location.ilike(f"%{zone}%")) # simple proxy since zone isn't a direct field

    priority_order = case(
        (Complaint.priority == "Critical", 1),
        (Complaint.priority == "High", 2),
        (Complaint.priority == "Medium", 3),
        (Complaint.priority == "Low", 4),
        else_=5
    )

    results = query.order_by(priority_order, Complaint.created_at.desc()).all()

    out_list = []
    for complaint, u_name, u_email in results:
        item = ComplaintOut.from_orm(complaint)
        item.user_name = u_name
        item.user_email = u_email
        item.predicted_category = complaint.ai_suggested_category
        out_list.append(item)

    return out_list

@router.patch("/complaints/{complaint_id}/status", response_model=ComplaintOut)
def update_complaint_status(
    complaint_id: int,
    status_in: ComplaintStatusUpdate,
    admin_user: User = Depends(require_any_admin),
    db: Session = Depends(get_db)
):
    if status_in.status not in ["Submitted", "Under Review", "In Progress", "Resolved", "Closed"]:
        raise HTTPException(status_code=400, detail="Invalid status option.")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if admin_user.role == "DEPARTMENT_ADMIN" and complaint.department_id != admin_user.department_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify complaints for this department")

    old_status = complaint.status
    complaint.status = status_in.status
    if status_in.status == "Resolved":
        if not status_in.resolution_remark or not status_in.resolution_remark.strip():
            raise HTTPException(status_code=400, detail="A resolution remark is required to resolve a complaint.")
        complaint.resolution_remark = status_in.resolution_remark

    db.commit()
    db.refresh(complaint)

    if old_status != status_in.status:
        update = ComplaintUpdate(
            complaint_id=complaint.id,
            user_id=admin_user.id,
            status=status_in.status,
            message=f"Status updated to {status_in.status} by Admin." + (f" Remark: {status_in.resolution_remark}" if status_in.status == "Resolved" else "")
        )
        db.add(update)
        

        
        db.commit()

    user = db.query(User).filter(User.id == complaint.citizen_id).first()
    out = ComplaintOut.from_orm(complaint)
    out.predicted_category = complaint.ai_suggested_category
    if user:
        out.user_name = user.name
        out.user_email = user.email
    return out

@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_analytics(
    admin_user: User = Depends(require_any_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if admin_user.role == "DEPARTMENT_ADMIN":
        query = query.filter(Complaint.department_id == admin_user.department_id)
        
    complaints = query.all()

    total = len(complaints)
    open_c = sum(1 for c in complaints if c.status in ["Submitted", "Under Review", "Reopened"])
    in_prog = sum(1 for c in complaints if c.status == "In Progress")
    resolved = sum(1 for c in complaints if c.status in ["Resolved", "Closed"])
    high_prio = sum(1 for c in complaints if c.priority in ["High", "Critical"])

    by_category = {}
    by_zone = {}
    by_priority = {}

    for c in complaints:
        by_category[c.category] = by_category.get(c.category, 0) + 1
        # Fallback pseudo-zone for analytics map since zone field isn't in DB
        zone = c.location.split()[0] if c.location else "Unknown"
        by_zone[zone] = by_zone.get(zone, 0) + 1
        by_priority[c.priority] = by_priority.get(c.priority, 0) + 1

    return {
        "total_complaints": total,
        "open_complaints": open_c,
        "in_progress_complaints": in_prog,
        "resolved_complaints": resolved,
        "high_priority_complaints": high_prio,
        "by_category": by_category,
        "by_zone": by_zone,
        "by_priority": by_priority
    }

@router.get("/super/departments", response_model=List[DepartmentOut])
def list_departments(
    super_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    depts = db.query(Department).all()
    return depts

@router.post("/super/reassign/{complaint_id}", response_model=ComplaintOut)
def reassign_complaint(
    complaint_id: int,
    payload: ComplaintReassignRequest,
    super_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Invalid target department")
        
    old_dept_id = complaint.department_id
    
    if old_dept_id != dept.id:
        complaint.department_id = dept.id
        db.commit()
        db.refresh(complaint)
        
        update = ComplaintUpdate(
            complaint_id=complaint.id,
            user_id=super_admin.id,
            status=complaint.status,
            message=f"Super Admin reassigned complaint from department {old_dept_id} to {dept.id} ({dept.name})."
        )
        db.add(update)
        

            
        db.commit()
    
    user = db.query(User).filter(User.id == complaint.citizen_id).first()
    out = ComplaintOut.from_orm(complaint)
    out.predicted_category = complaint.ai_suggested_category
    if user:
        out.user_name = user.name
        out.user_email = user.email
    return out

@router.patch("/super/complaints/{complaint_id}/category", response_model=ComplaintOut)
def correct_complaint_category(
    complaint_id: int,
    payload: ComplaintCategoryUpdateRequest,
    super_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    old_category = complaint.category
    
    if old_category != payload.category:
        complaint.category = payload.category
        db.commit()
        db.refresh(complaint)
        
        update = ComplaintUpdate(
            complaint_id=complaint.id,
            user_id=super_admin.id,
            status=complaint.status,
            message=f"Super Admin corrected category from '{old_category}' to '{payload.category}'."
        )
        db.add(update)
        

        
        db.commit()
    
    user = db.query(User).filter(User.id == complaint.citizen_id).first()
    out = ComplaintOut.from_orm(complaint)
    out.predicted_category = complaint.ai_suggested_category
    if user:
        out.user_name = user.name
        out.user_email = user.email
    return out

@router.get("/super/users", response_model=List[UserOut])
def list_admin_users(
    super_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(User.role.in_(["DEPARTMENT_ADMIN", "SUPER_ADMIN", "admin"])).all()
    return users
