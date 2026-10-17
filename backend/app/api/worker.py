from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db
from backend.app.models.entities import Computer, ComputeSession

router = APIRouter()

class WorkerHeartbeat(BaseModel):
    safe_identifier: str
    cpu_percent: float
    ram_percent: float
    gpu_percent: float = 0.0
    active_session_id: str | None = None
    agent_version: str = "1.0.0"

class WorkerRegister(BaseModel):
    hostname: str
    safe_identifier: str
    lab_id: str
    cpu_model: str
    cpu_cores: int
    ram_gb: int
    gpu_model: str | None = None
    gpu_vram_gb: int = 0
    storage_gb: int = 512

@router.post("/heartbeat")
def receive_heartbeat(data: WorkerHeartbeat, db: Session = Depends(get_db)):
    comp = db.query(Computer).filter(Computer.safe_identifier == data.safe_identifier).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not recognized")
    
    comp.last_heartbeat = datetime.now(timezone.utc)
    comp.agent_version = data.agent_version
    
    # If active session is reported, sync status
    if data.active_session_id:
        session = db.query(ComputeSession).filter(ComputeSession.id == data.active_session_id).first()
        if session and session.status == "allocating":
            session.status = "active"
            if not session.start_time:
                session.start_time = datetime.now(timezone.utc)
            comp.status = "in_use"
            
    db.commit()
    return {"status": "ok", "ack": datetime.now(timezone.utc).isoformat()}
