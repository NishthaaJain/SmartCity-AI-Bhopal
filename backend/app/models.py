import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    users = relationship("User", back_populates="department")
    complaints = relationship("Complaint", back_populates="department")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="CITIZEN", nullable=False) # 'CITIZEN', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN'
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    department = relationship("Department", back_populates="users")
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="[Complaint.citizen_id]")

    @property
    def department_name(self):
        return self.department.name if self.department else None

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    priority = Column(String(20), default="Medium", nullable=False) # 'Low', 'Medium', 'High', 'Critical'
    status = Column(String(30), default="Submitted", nullable=False) # 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Reopened', 'Closed'
    
    ai_suggested_category = Column(String(50), nullable=True)
    rule_suggested_priority = Column(String(20), nullable=True)
    ai_reasoning = Column(Text, nullable=True)
    
    photo_path = Column(String(255), nullable=True)
    resolution_remark = Column(Text, nullable=True)
    resolution_photo_path = Column(String(255), nullable=True)
    
    sla_due_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    citizen = relationship("User", foreign_keys=[citizen_id], back_populates="complaints")
    department = relationship("Department", back_populates="complaints")
    updates = relationship("ComplaintUpdate", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintUpdate(Base):
    __tablename__ = "complaint_updates"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(30), nullable=False)
    message = Column(Text, nullable=False)
    photo_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaint = relationship("Complaint", back_populates="updates")
    user = relationship("User")

