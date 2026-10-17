import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.api.deps import get_db
import backend.app.models # ensures all models are loaded
from backend.app.core.seed import seed_database
from backend.app.models.entities import ComputeSession, Computer, StudentProfile
from backend.app.main import app

TEST_DB_PATH = "./test_idlenode.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

@pytest.fixture(autouse=True)
def reset_sessions():
    db = TestingSessionLocal()
    # Reset sessions and computer states
    db.query(ComputeSession).delete()
    for c in db.query(Computer).all():
        if c.status != "maintenance":
            c.status = "available"
    # Ensure pending student remains pending for HOD test
    p = db.query(StudentProfile).filter(StudentProfile.roll_number == "23CS205").first()
    if p:
        p.approval_status = "pending"
    db.commit()
    db.close()
    yield

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["grid_status"] == "ONLINE"

def test_student_login():
    response = client.post("/api/auth/login", json={
        "email": "student@campus.edu",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "student"
    assert "access_token" in data

def test_role_enforcement_student_forbidden_from_admin():
    login_resp = client.post("/api/auth/login", json={
        "email": "student@campus.edu",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    admin_resp = client.get("/api/admin/overview", headers=headers)
    assert admin_resp.status_code == 403

def test_role_enforcement_admin_forbidden_from_compute():
    login_resp = client.post("/api/auth/login", json={
        "email": "admin@campus.edu",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    compute_resp = client.post("/api/student/requests", json={
        "workload_type": "development",
        "min_cpu_cores": 4,
        "min_ram_gb": 16,
        "requested_minutes": 30
    }, headers=headers)
    assert compute_resp.status_code == 403

def test_compute_request_allocation_and_credits():
    login_resp = client.post("/api/auth/login", json={
        "email": "student@campus.edu",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/student/requests", json={
        "workload_type": "development",
        "min_cpu_cores": 4,
        "min_ram_gb": 16,
        "requested_minutes": 60
    }, headers=headers)
    assert resp.status_code == 200
    session_data = resp.json()
    assert session_data["status"] in ["allocating", "connecting"]
    assert session_data["computer_id"] is not None
    session_id = session_data["id"]

    # Connect to session
    conn_resp = client.post(f"/api/student/sessions/{session_id}/connect", headers=headers)
    assert conn_resp.status_code == 200
    assert conn_resp.json()["status"] == "active"

    # End session
    end_resp = client.post(f"/api/student/sessions/{session_id}/end", json={"reason": "Completed coursework"}, headers=headers)
    assert end_resp.status_code == 200
    assert end_resp.json()["status"] == "completed"

def test_queue_concurrency_limit():
    login_resp = client.post("/api/auth/login", json={
        "email": "student@campus.edu",
        "password": "password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    req1 = client.post("/api/student/requests", json={
        "workload_type": "general",
        "min_cpu_cores": 4,
        "min_ram_gb": 16,
        "requested_minutes": 30
    }, headers=headers)
    assert req1.status_code == 200
    session_id = req1.json()["id"]

    # Second request should fail with concurrency limit
    req2 = client.post("/api/student/requests", json={
        "workload_type": "general",
        "min_cpu_cores": 4,
        "min_ram_gb": 16,
        "requested_minutes": 30
    }, headers=headers)
    assert req2.status_code == 400
    assert "concurrency" in req2.json()["detail"].lower()

def test_hod_approval_workflow():
    hod_login = client.post("/api/auth/login", json={
        "email": "hod.cs@campus.edu",
        "password": "password123"
    })
    hod_token = hod_login.json()["access_token"]
    hod_headers = {"Authorization": f"Bearer {hod_token}"}

    pending_resp = client.get("/api/hod/students/pending", headers=hod_headers)
    assert pending_resp.status_code == 200
    pending_list = pending_resp.json()
    assert len(pending_list) > 0
    target_id = pending_list[0]["id"]

    review_resp = client.post(f"/api/hod/students/{target_id}/review", json={
        "action": "approve"
    }, headers=hod_headers)
    assert review_resp.status_code == 200
    assert "approved" in review_resp.json()["message"]

def test_lab_assistant_monitoring():
    lab_login = client.post("/api/auth/login", json={
        "email": "labtech@campus.edu",
        "password": "password123"
    })
    token = lab_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    labs_resp = client.get("/api/lab-assistant/labs", headers=headers)
    assert labs_resp.status_code == 200
    assert len(labs_resp.json()) > 0
