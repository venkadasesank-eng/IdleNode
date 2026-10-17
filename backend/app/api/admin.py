from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, require_institution_admin
from backend.app.core.config import settings
from backend.app.models.entities import User, Computer, ComputeSession, Lab, Department, AuditLog
from backend.app.schemas.schemas import AuditLogResponse

router = APIRouter()

class CreditPolicyUpdate(BaseModel):
    daily_allowance: int
    timezone: str = "Asia/Kolkata"
    rate_general: int = 5
    rate_development: int = 8
    rate_data_science: int = 12
    rate_ml_gpu: int = 25
    rate_simulation: int = 18

class ComputerCreate(BaseModel):
    lab_id: str
    safe_identifier: str
    hostname: str
    os_name: str = "Ubuntu 24.04 LTS"
    cpu_model: str
    cpu_cores: int
    ram_gb: int
    gpu_model: Optional[str] = None
    gpu_vram_gb: int = 0
    storage_gb: int = 512
    supported_workloads: str = "general,development,data_science,ml_gpu,simulation"

@router.get("/overview")
def get_admin_overview(current_user: User = Depends(require_institution_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_computers = db.query(Computer).count()
    active_sessions = db.query(ComputeSession).filter(ComputeSession.status == "active").count()
    total_completed = db.query(ComputeSession).filter(ComputeSession.status == "completed").count()
    
    return {
        "institution_name": "Apex Engineering Institute",
        "total_users": total_users,
        "total_students": total_students,
        "total_computers": total_computers,
        "active_sessions": active_sessions,
        "completed_sessions": total_completed,
        "platform_status": "OPERATIONAL"
    }

@router.get("/credit-policy")
def get_credit_policy(current_user: User = Depends(require_institution_admin)):
    return {
        "daily_allowance": settings.DAILY_CREDIT_ALLOWANCE,
        "timezone": settings.TIMEZONE,
        "reset_hour": settings.CREDIT_RESET_HOUR,
        "rates": {
            "general": settings.RATE_GENERAL_DESKTOP,
            "development": settings.RATE_DEV_CPU,
            "data_science": settings.RATE_DATA_SCIENCE,
            "ml_gpu": settings.RATE_ML_GPU,
            "simulation": settings.RATE_SIMULATION,
        }
    }

@router.put("/credit-policy")
def update_credit_policy(req: CreditPolicyUpdate, current_user: User = Depends(require_institution_admin), db: Session = Depends(get_db)):
    settings.DAILY_CREDIT_ALLOWANCE = req.daily_allowance
    settings.TIMEZONE = req.timezone
    settings.RATE_GENERAL_DESKTOP = req.rate_general
    settings.RATE_DEV_CPU = req.rate_development
    settings.RATE_DATA_SCIENCE = req.rate_data_science
    settings.RATE_ML_GPU = req.rate_ml_gpu
    settings.RATE_SIMULATION = req.rate_simulation

    db.add(AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="UPDATE_CREDIT_POLICY",
        target_type="POLICY",
        target_id="CREDIT_SETTINGS",
        details=f"Allowance={req.daily_allowance}, TZ={req.timezone}"
    ))
    db.commit()
    return {"message": "Credit policy successfully updated"}

@router.post("/computers")
def create_computer(req: ComputerCreate, current_user: User = Depends(require_institution_admin), db: Session = Depends(get_db)):
    existing = db.query(Computer).filter(Computer.safe_identifier == req.safe_identifier).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identifier already exists")

    comp = Computer(
        lab_id=req.lab_id,
        safe_identifier=req.safe_identifier,
        hostname=req.hostname,
        os_name=req.os_name,
        cpu_model=req.cpu_model,
        cpu_cores=req.cpu_cores,
        ram_gb=req.ram_gb,
        gpu_model=req.gpu_model,
        gpu_vram_gb=req.gpu_vram_gb,
        storage_gb=req.storage_gb,
        supported_workloads=req.supported_workloads,
        status="available"
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)

    db.add(AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="REGISTER_COMPUTER",
        target_type="COMPUTER",
        target_id=comp.id,
        details=f"Added {comp.safe_identifier}"
    ))
    db.commit()
    return comp

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(current_user: User = Depends(require_institution_admin), db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
