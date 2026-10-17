from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, require_hod
from backend.app.models.entities import User, StudentProfile, Department, Lab, Computer, ComputeSession, AuditLog

router = APIRouter()

class StudentApprovalAction(BaseModel):
    action: str # "approve" or "reject"
    reason: Optional[str] = None

@router.get("/overview")
def get_department_overview(current_user: User = Depends(require_hod), db: Session = Depends(get_db)):
    dept = db.query(Department).first() # in multi-tenant, filter by current_user.staff_profile.department_id
    dept_id = dept.id if dept else None

    pending_students = db.query(StudentProfile).filter(StudentProfile.approval_status == "pending").count()
    approved_students = db.query(StudentProfile).filter(StudentProfile.approval_status == "approved").count()
    total_computers = db.query(Computer).count()
    active_sessions = db.query(ComputeSession).filter(ComputeSession.status.in_(["active", "connecting"])).count()

    return {
        "department_name": dept.name if dept else "Computer Science & Engineering",
        "pending_registrations": pending_students,
        "approved_students": approved_students,
        "total_computers": total_computers,
        "active_sessions": active_sessions
    }

@router.get("/students/pending")
def list_pending_students(current_user: User = Depends(require_hod), db: Session = Depends(get_db)):
    pending = db.query(StudentProfile).filter(StudentProfile.approval_status == "pending").all()
    result = []
    for p in pending:
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "full_name": p.user.full_name,
            "email": p.user.email,
            "roll_number": p.roll_number,
            "academic_year": p.academic_year,
            "created_at": p.user.created_at
        })
    return result

@router.post("/students/{profile_id}/review")
def review_student_registration(profile_id: str, req: StudentApprovalAction, current_user: User = Depends(require_hod), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    now = datetime.now(timezone.utc)
    if req.action == "approve":
        profile.approval_status = "approved"
        profile.approved_by_id = current_user.id
        profile.approved_at = now
        profile.user.status = "active"
    elif req.action == "reject":
        profile.approval_status = "rejected"
        profile.rejection_reason = req.reason or "Institutional eligibility requirements not met"
        profile.user.status = "rejected"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be 'approve' or 'reject'")

    db.add(AuditLog(
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action=f"STUDENT_REGISTRATION_{req.action.upper()}",
        target_type="STUDENT",
        target_id=profile.user_id,
        details=req.reason
    ))
    db.commit()
    return {"message": f"Student registration has been {profile.approval_status}"}
