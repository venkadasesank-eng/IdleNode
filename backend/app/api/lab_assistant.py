from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, require_lab_assistant
from backend.app.models.entities import User, Computer, ComputeSession, Lab, AuditLog
from backend.app.schemas.schemas import ComputerResponse, SessionResponse
from backend.app.services.scheduler_service import end_session

router = APIRouter()

class AdminStopSessionRequest(BaseModel):
    reason: str

class ToggleMaintenanceRequest(BaseModel):
    maintenance: bool
    reason: Optional[str] = None

@router.get("/labs")
def get_assigned_labs(current_user: User = Depends(require_lab_assistant), db: Session = Depends(get_db)):
    labs = db.query(Lab).all()
    result = []
    for l in labs:
        comp_count = db.query(Computer).filter(Computer.lab_id == l.id).count()
        busy_count = db.query(Computer).filter(Computer.lab_id == l.id, Computer.status.in_(["busy", "in_use"])).count()
        result.append({
            "id": l.id,
            "name": l.name,
            "room_number": l.room_number,
            "capacity": l.capacity,
            "total_computers": comp_count,
            "active_computers": busy_count
        })
    return result

@router.get("/computers", response_model=List[ComputerResponse])
def get_lab_computers(current_user: User = Depends(require_lab_assistant), db: Session = Depends(get_db)):
    computers = db.query(Computer).all()
    result = []
    for c in computers:
        resp = ComputerResponse.model_validate(c)
        if c.lab:
            resp.lab_name = c.lab.name
            if c.lab.department:
                resp.department_name = c.lab.department.name
        result.append(resp)
    return result

@router.post("/computers/{computer_id}/maintenance")
def toggle_computer_maintenance(computer_id: str, req: ToggleMaintenanceRequest, current_user: User = Depends(require_lab_assistant), db: Session = Depends(get_db)):
    computer = db.query(Computer).filter(Computer.id == computer_id).first()
    if not computer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")
    
    computer.status = "maintenance" if req.maintenance else "available"
    
    # Audit action
    db.add(AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="TOGGLE_MAINTENANCE",
        target_type="COMPUTER",
        target_id=computer.id,
        details=f"Set to {computer.status}. Reason: {req.reason or 'Routine inspection'}"
    ))
    db.commit()
    return {"message": f"Computer {computer.safe_identifier} status updated to {computer.status}"}

@router.post("/sessions/{session_id}/stop")
def admin_stop_session(session_id: str, req: AdminStopSessionRequest, current_user: User = Depends(require_lab_assistant), db: Session = Depends(get_db)):
    if not req.reason or len(req.reason.strip()) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A valid reason must be provided for administrative termination")

    session = end_session(db, session_id, current_user.id, reason=f"Stopped by {current_user.role} ({current_user.email}): {req.reason}")
    
    db.add(AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="TERMINATE_SESSION_ADMIN",
        target_type="SESSION",
        target_id=session_id,
        details=req.reason
    ))
    db.commit()
    return {"message": "Session terminated by administrator", "session_id": session.id}
