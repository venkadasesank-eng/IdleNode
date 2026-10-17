from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from backend.app.core.config import settings
from backend.app.models.entities import (
    Computer, ComputeSession, User, StudentProfile, Notification, AuditLog, CreditAccount
)
from backend.app.schemas.schemas import ComputeRequestCreate
from backend.app.services.credit_service import (
    get_or_create_credit_account, get_workload_rate, reserve_credits, release_credits, charge_credits
)

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def request_compute(db: Session, student_id: str, req: ComputeRequestCreate) -> ComputeSession:
    # 1. Verify student account status
    user = db.query(User).filter(User.id == student_id).first()
    if not user or user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not active")
    
    if user.student_profile and user.student_profile.approval_status != "approved":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student account pending administrative approval")

    # 2. Concurrency limit check
    active_sessions = db.query(ComputeSession).filter(
        ComputeSession.student_id == student_id,
        ComputeSession.status.in_(["requested", "queued", "allocating", "starting", "connecting", "active", "disconnected", "reconnecting"])
    ).count()
    if active_sessions >= settings.MAX_CONCURRENT_SESSIONS_PER_STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Concurrency limit reached ({settings.MAX_CONCURRENT_SESSIONS_PER_STUDENT} active or queued session allowed)."
        )

    # 3. Credit affordability check
    rate = get_workload_rate(req.workload_type)
    estimated_credits = max(1, int((rate * req.requested_minutes) / 60))
    account = get_or_create_credit_account(db, student_id)
    
    if account.current_balance - account.reserved_credits < estimated_credits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient credits: needs {estimated_credits} credits, but only {account.current_balance - account.reserved_credits} available."
        )

    # 4. Search for compatible available computer
    query = db.query(Computer).filter(
        Computer.status == "available",
        Computer.cpu_cores >= req.min_cpu_cores,
        Computer.ram_gb >= req.min_ram_gb
    )
    if req.require_gpu:
        query = query.filter(Computer.gpu_model.isnot(None), Computer.gpu_vram_gb > 0)
    
    # Atomically select computer with lock
    computer = query.with_for_update(skip_locked=True).first()

    if computer:
        # Machine found: reserve atomically
        computer.status = "reserved"
        session = ComputeSession(
            student_id=student_id,
            computer_id=computer.id,
            workload_type=req.workload_type,
            status="allocating", # transitioning to connecting
            requested_minutes=req.requested_minutes,
            credit_rate=rate,
            credits_reserved=estimated_credits,
            credits_consumed=0
        )
        db.add(session)
        reserve_credits(db, account, estimated_credits, f"Reservation for session on {computer.safe_identifier}", session.id)
        db.commit()
        db.refresh(session)
        
        # Notify student
        db.add(Notification(
            user_id=student_id,
            title="Compute Node Allocated",
            message=f"Node {computer.safe_identifier} reserved for your {req.workload_type} workload.",
            notification_type="success",
            action_url=f"/workspace/{session.id}"
        ))
        db.commit()
        return session
    else:
        # No machine available: place in queue
        queue_count = db.query(ComputeSession).filter(ComputeSession.status == "queued").count()
        session = ComputeSession(
            student_id=student_id,
            computer_id=None,
            workload_type=req.workload_type,
            status="queued",
            queue_position=queue_count + 1,
            requested_minutes=req.requested_minutes,
            credit_rate=rate,
            credits_reserved=estimated_credits,
            credits_consumed=0
        )
        db.add(session)
        reserve_credits(db, account, estimated_credits, "Reservation for queued compute request", session.id)
        db.commit()
        db.refresh(session)
        
        db.add(Notification(
            user_id=student_id,
            title="Request Queued",
            message=f"Your compute request is position #{session.queue_position} in the queue.",
            notification_type="info"
        ))
        db.commit()
        return session

def connect_session(db: Session, session_id: str, student_id: str) -> ComputeSession:
    session = db.query(ComputeSession).filter(
        ComputeSession.id == session_id,
        ComputeSession.student_id == student_id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session.status in ["allocating", "starting", "connecting", "disconnected", "reconnecting"]:
        session.status = "active"
        if not session.start_time:
            session.start_time = utc_now()
        session.reconnect_deadline = None
        if session.computer:
            session.computer.status = "in_use"
        db.commit()
        db.refresh(session)
    return session

def disconnect_session(db: Session, session_id: str, student_id: str) -> ComputeSession:
    session = db.query(ComputeSession).filter(
        ComputeSession.id == session_id,
        ComputeSession.student_id == student_id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session.status == "active":
        session.status = "disconnected"
        session.reconnect_deadline = utc_now() + timedelta(seconds=settings.DISCONNECT_GRACE_PERIOD_SECONDS)
        db.commit()
        db.refresh(session)
    return session

def end_session(db: Session, session_id: str, actor_id: str, reason: str = "User ended session") -> ComputeSession:
    session = db.query(ComputeSession).filter(ComputeSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session.status in ["completed", "failed", "cancelled"]:
        return session

    now = utc_now()
    session.end_time = now
    session.status = "completed"
    session.termination_reason = reason

    # Calculate actual minutes
    if session.start_time:
        duration_seconds = max(0, (now - session.start_time.replace(tzinfo=timezone.utc)).total_seconds())
        session.actual_minutes = max(1, int(duration_seconds / 60))
    else:
        session.actual_minutes = 0

    # Charge credits for actual time used
    actual_cost = max(1, int((session.credit_rate * session.actual_minutes) / 60)) if session.actual_minutes > 0 else 0
    actual_charge = min(session.credits_reserved, actual_cost)
    
    account = db.query(CreditAccount).filter(CreditAccount.user_id == session.student_id).first()
    if account:
        charge_credits(db, account, actual_charge, f"Session {session.id} ({session.actual_minutes} min)", session.id)
        # Release any remaining unused reserved credits
        unused = session.credits_reserved - actual_charge
        if unused > 0:
            release_credits(db, account, unused)
    
    session.credits_consumed = actual_charge

    # Release computer
    computer_id = session.computer_id
    if session.computer:
        session.computer.status = "available"
        session.computer_id = None
    
    db.commit()
    db.refresh(session)

    # Trigger queue advance to allocate released computer if available
    if computer_id:
        advance_queue(db, computer_id)

    return session

def advance_queue(db: Session, released_computer_id: Optional[str] = None):
    # Check next queued request
    queued = db.query(ComputeSession).filter(
        ComputeSession.status == "queued"
    ).order_by(ComputeSession.queue_position.asc()).first()
    
    if not queued:
        return

    # Check if a compatible computer is available
    comp_query = db.query(Computer).filter(Computer.status == "available")
    if released_computer_id:
        comp_query = comp_query.filter(Computer.id == released_computer_id)
    computer = comp_query.first()

    if computer:
        computer.status = "reserved"
        queued.computer_id = computer.id
        queued.status = "allocating"
        queued.queue_position = None
        db.commit()

        # Update remaining queue positions
        remaining = db.query(ComputeSession).filter(ComputeSession.status == "queued").order_by(ComputeSession.created_at.asc()).all()
        for idx, s in enumerate(remaining):
            s.queue_position = idx + 1
        db.commit()

        # Notify student
        db.add(Notification(
            user_id=queued.student_id,
            title="Computer Ready!",
            message=f"Node {computer.safe_identifier} is now ready for your queued session.",
            notification_type="success",
            action_url=f"/workspace/{queued.id}"
        ))
        db.commit()

def cancel_queued_request(db: Session, session_id: str, student_id: str):
    session = db.query(ComputeSession).filter(
        ComputeSession.id == session_id,
        ComputeSession.student_id == student_id,
        ComputeSession.status == "queued"
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queued session not found")
    
    session.status = "cancelled"
    session.termination_reason = "Cancelled by student while in queue"
    
    # Release reserved credits (no charge for queued cancel)
    account = db.query(CreditAccount).filter(CreditAccount.user_id == student_id).first()
    if account:
        release_credits(db, account, session.credits_reserved)
    
    db.commit()
    
    # Re-index remaining queue
    remaining = db.query(ComputeSession).filter(ComputeSession.status == "queued").order_by(ComputeSession.queue_position.asc()).all()
    for idx, s in enumerate(remaining):
        s.queue_position = idx + 1
    db.commit()
