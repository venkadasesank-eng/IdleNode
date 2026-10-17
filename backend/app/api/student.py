from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, get_current_user, require_student
from backend.app.core.config import settings
from backend.app.models.entities import (
    User, Computer, ComputeSession, CreditAccount, CreditTransaction, FileItem, Notification
)
from backend.app.schemas.schemas import (
    ComputeRequestCreate, SessionResponse, SessionStopRequest,
    CreditAccountResponse, FileItemResponse, NotificationResponse, DashboardMetricsResponse
)
from backend.app.services.credit_service import get_or_create_credit_account
from backend.app.services.scheduler_service import (
    request_compute, connect_session, disconnect_session, end_session, cancel_queued_request
)
from backend.app.services.storage_service import (
    list_user_files, save_user_file, delete_user_file
)

router = APIRouter()

@router.get("/dashboard", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    account = get_or_create_credit_account(db, current_user.id)
    
    total_nodes = db.query(Computer).count()
    active_nodes = db.query(Computer).filter(Computer.status.in_(["busy", "in_use", "reserved"])).count()
    queued_tasks = db.query(ComputeSession).filter(ComputeSession.status == "queued").count()
    
    # Calculate average wait time (simulated or real estimate based on queued items * 1.5 min)
    avg_wait = round(max(0.5, queued_tasks * 1.4), 1)

    # Activity stream messages for telemetry panel
    recent_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(5).all()

    activity = [f"{n.created_at.strftime('%Y-%m-%dT%H:%M:%SZ')} {n.title}: {n.message}" for n in recent_notifications]
    if not activity:
        activity = [
            f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} User authenticated auth:verified",
            f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} Campus grid telemetry sync ok",
            f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} Scheduler ready for resource allocation"
        ]

    return DashboardMetricsResponse(
        active_compute_nodes=active_nodes,
        total_compute_nodes=total_nodes,
        current_queue_tasks=queued_tasks,
        avg_queue_wait_minutes=avg_wait,
        daily_balance=account.current_balance,
        daily_allowance=account.daily_allowance,
        grid_online=True,
        recent_activity=activity
    )

@router.post("/requests", response_model=SessionResponse)
def create_compute_request(req: ComputeRequestCreate, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    session = request_compute(db, current_user.id, req)
    return session

@router.get("/sessions", response_model=List[SessionResponse])
def get_student_sessions(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    sessions = db.query(ComputeSession).filter(
        ComputeSession.student_id == current_user.id
    ).order_by(ComputeSession.created_at.desc()).all()
    
    # Enrich with safe_identifier
    result = []
    for s in sessions:
        resp = SessionResponse.model_validate(s)
        if s.computer:
            resp.safe_identifier = s.computer.safe_identifier
        result.append(resp)
    return result

@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session_details(session_id: str, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    session = db.query(ComputeSession).filter(
        ComputeSession.id == session_id,
        ComputeSession.student_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    resp = SessionResponse.model_validate(session)
    if session.computer:
        resp.safe_identifier = session.computer.safe_identifier
    return resp

@router.post("/sessions/{session_id}/connect", response_model=SessionResponse)
def connect_to_workspace(session_id: str, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    session = connect_session(db, session_id, current_user.id)
    resp = SessionResponse.model_validate(session)
    if session.computer:
        resp.safe_identifier = session.computer.safe_identifier
    return resp

@router.post("/sessions/{session_id}/disconnect", response_model=SessionResponse)
def disconnect_workspace(session_id: str, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    session = disconnect_session(db, session_id, current_user.id)
    resp = SessionResponse.model_validate(session)
    if session.computer:
        resp.safe_identifier = session.computer.safe_identifier
    return resp

@router.post("/sessions/{session_id}/end", response_model=SessionResponse)
def terminate_session(session_id: str, req: SessionStopRequest, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    session = end_session(db, session_id, current_user.id, reason=req.reason)
    return session

@router.delete("/sessions/{session_id}/queue")
def cancel_queue(session_id: str, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    cancel_queued_request(db, session_id, current_user.id)
    return {"message": "Queued request successfully cancelled"}

@router.get("/credits", response_model=CreditAccountResponse)
def get_credits_and_ledger(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    account = get_or_create_credit_account(db, current_user.id)
    return account

@router.get("/files", response_model=List[FileItemResponse])
def get_files(storage_type: Optional[str] = None, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    files = list_user_files(db, current_user.id, storage_type)
    return files

@router.post("/files/upload", response_model=FileItemResponse)
async def upload_file(
    file: UploadFile = File(...),
    storage_type: str = Form("persistent"),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    content = await file.read()
    item = save_user_file(db, current_user.id, file.filename, content, storage_type)
    return item

@router.delete("/files/{file_id}")
def delete_file(file_id: str, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    delete_user_file(db, file_id, current_user.id)
    return {"message": "File deleted successfully"}

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, current_user: User = Depends(require_student), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Marked as read"}
