from fastapi import APIRouter, Query
from app.schemas import (
    ClassificationRequest, ClassificationResponse,
    TrafficPredictionResponse, WastePredictionResponse, PollutionPredictionResponse
)
from app.ml_service import ml_service

router = APIRouter(prefix="/predict", tags=["AI Predictions"])

from app.routing import CATEGORY_TO_DEPT_CODE, SLA_HOURS

@router.post("/analyze-complaint", response_model=ClassificationResponse)
def analyze_complaint_text(payload: ClassificationRequest):
    res = ml_service.analyze_complaint(payload.description)
    category = res["suggested_category"]
    priority = res["suggested_priority"]
    dept_code = CATEGORY_TO_DEPT_CODE.get(category, "GENERAL")
    
    # Map code back to readable name for frontend if desired, or just use code
    dept_name_map = {
        "ROADS": "Roads & Public Works",
        "WASTE": "Sanitation & Waste",
        "WATER": "Water Supply Department",
        "ELECTRICAL": "Electricity Board",
        "DRAINAGE": "Sewage & Drainage",
        "TRAFFIC": "Traffic Police",
        "GENERAL": "General Administration"
    }
    
    return {
        "predicted_category": category,
        "priority": priority,
        "confidence_score": res["confidence_score"],
        "priority_reason": res["short_reason"],
        "department": dept_name_map.get(dept_code, "General Administration"),
        "sla_hours": SLA_HOURS.get(priority, 72)
    }

@router.get("/traffic", response_model=TrafficPredictionResponse)
def predict_traffic_congestion(
    zone: str = Query("Downtown"),
    hour: int = Query(9, ge=0, le=23),
    day_of_week: int = Query(1, ge=0, le=6),
    is_weekend: bool = Query(False),
    weather: str = Query("Clear")
):
    return {
        "zone": zone,
        "hour": hour,
        "predicted_congestion": 0.5,
        "congestion_level": "Moderate",
        "recommendation": "Use alternate routes"
    }

@router.get("/waste", response_model=WastePredictionResponse)
def predict_waste_generation(
    zone: str = Query("Downtown"),
    days_ahead: int = Query(7, ge=1, le=30)
):
    return {
        "zone": zone,
        "forecast": [{"date": f"Day {i+1}", "predicted_volume_tons": 10.0} for i in range(days_ahead)],
        "total_forecast_volume_tons": 10.0 * days_ahead,
        "recommended_trucks": 2
    }

@router.get("/pollution", response_model=PollutionPredictionResponse)
def predict_pollution_aqi(
    zone: str = Query("Downtown")
):
    return {
        "zone": zone,
        "predicted_aqi": 50,
        "category": "Good",
        "pm25": 12.0,
        "no2": 20.0,
        "health_advisory": "Air quality is considered satisfactory."
    }
