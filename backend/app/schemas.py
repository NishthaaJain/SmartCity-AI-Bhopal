import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# Auth Schemas
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "citizen"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Complaint Schemas
class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = None # Will auto-classify if omitted or "Auto-detect"
    location: str
    zone: str

class ComplaintStatusUpdate(BaseModel):
    status: str # 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed'
    resolution_remark: Optional[str] = None

class ComplaintUpdateOut(BaseModel):
    id: int
    complaint_id: int
    user_id: int
    status: str
    message: str
    photo_path: Optional[str] = None
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

class ComplaintOut(BaseModel):
    id: int
    citizen_id: int
    department_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    title: str
    description: str
    category: str
    predicted_category: Optional[str] = None # Maps to ai_suggested_category
    priority: str
    status: str
    location: str
    zone: str = "Downtown" # Fallback for frontend
    photo_path: Optional[str] = None
    created_at: datetime.datetime
    sla_due_at: Optional[datetime.datetime] = None
    ai_reasoning: Optional[str] = None
    updates: List[ComplaintUpdateOut] = []

    class Config:
        from_attributes = True

class ComplaintReopenRequest(BaseModel):
    remark: str

class DuplicateCheckRequest(BaseModel):
    description: str
    category: str
    location: str

class ComplaintReassignRequest(BaseModel):
    department_id: int

class ComplaintCategoryUpdateRequest(BaseModel):
    category: str

class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Prediction Schemas
class ClassificationRequest(BaseModel):
    description: str

class ClassificationResponse(BaseModel):
    predicted_category: str
    priority: str
    confidence_score: float
    priority_reason: str
    department: str
    sla_hours: int

class TrafficPredictionQuery(BaseModel):
    zone: str
    hour: int = 9
    day_of_week: int = 1
    is_weekend: bool = False
    weather: str = "Clear"

class TrafficPredictionResponse(BaseModel):
    zone: str
    hour: int
    predicted_congestion: float
    congestion_level: str # Low, Moderate, High, Severe
    recommendation: str

class WastePredictionQuery(BaseModel):
    zone: str
    days_ahead: int = 7

class WasteDayForecast(BaseModel):
    date: str
    predicted_volume_tons: float

class WastePredictionResponse(BaseModel):
    zone: str
    forecast: List[WasteDayForecast]
    total_forecast_volume_tons: float
    recommended_trucks: int

class PollutionPredictionQuery(BaseModel):
    zone: str

class PollutionPredictionResponse(BaseModel):
    zone: str
    predicted_aqi: int
    category: str # Good, Moderate, Unhealthy, Severe
    pm25: float
    no2: float
    health_advisory: str

class AdminAnalyticsResponse(BaseModel):
    total_complaints: int
    open_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    high_priority_complaints: int
    by_category: dict
    by_zone: dict
    by_priority: dict

