import pytest
import sys
import os
from fastapi.testclient import TestClient

# Add backend app directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_auth_flow():
    # Register test citizen
    reg_data = {
        "name": "Test Citizen",
        "email": "testcitizen@city.org",
        "password": "Password@123",
        "role": "citizen"
    }
    response = client.post("/auth/register", json=reg_data)
    assert response.status_code in [201, 409]  # 409 if already exists

    # Login
    login_data = {
        "email": "testcitizen@city.org",
        "password": "Password@123"
    }
    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "citizen"
    token = data["access_token"]

    # Get /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "testcitizen@city.org"

def test_complaint_classification_endpoint():
    payload = {
        "description": "A deep pothole on the main road is causing accidents."
    }
    response = client.post("/predict/analyze-complaint", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["predicted_category"] == "Road / Pothole"
    assert "department" in res

def test_traffic_prediction_endpoint():
    response = client.get("/predict/traffic?zone=Downtown&hour=18&day_of_week=1&is_weekend=false")
    assert response.status_code == 200
    res = response.json()
    assert "predicted_congestion" in res
    assert "recommendation" in res

def test_waste_prediction_endpoint():
    response = client.get("/predict/waste?zone=East Industrial&days_ahead=7")
    assert response.status_code == 200
    res = response.json()
    assert len(res["forecast"]) == 7
    assert res["recommended_trucks"] >= 1

def test_pollution_prediction_endpoint():
    response = client.get("/predict/pollution?zone=North Heights")
    assert response.status_code == 200
    res = response.json()
    assert "predicted_aqi" in res
    assert "health_advisory" in res

def test_admin_protection():
    # Attempt to fetch admin analytics without token
    response = client.get("/admin/analytics")
    assert response.status_code == 401

    # Login as super admin seed account
    login_data = {
        "email": "superadmin@bhopal.gov.in",
        "password": "Admin@123"
    }
    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 200
    admin_token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch admin analytics with token
    analytics_resp = client.get("/admin/analytics", headers=headers)
    assert analytics_resp.status_code == 200
    data = analytics_resp.json()
    assert "total_complaints" in data
    assert "high_priority_complaints" in data

