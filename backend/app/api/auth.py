from typing import List
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, get_current_user
from backend.app.core.config import settings
from backend.app.core.security import verify_password, get_password_hash, create_access_token, Role
from backend.app.models.entities import User, StudentProfile, CreditAccount, Department, AuditLog
from backend.app.schemas.schemas import (
    UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse,
    DemoLoginRequest, DemoAccountInfo
)
from backend.app.services.credit_service import get_or_create_credit_account

ALLOWED_DEMO_ROLES = {
    "student": {
        "email": "student@campus.edu",
        "name": "Aarav Sharma",
        "label": "Student",
        "description": "Explore compute requests, sessions, credits, notifications, file management, and student dashboard features."
    },
    "lab_assistant": {
        "email": "labtech@campus.edu",
        "name": "Pooja Patel",
        "label": "Lab Assistant",
        "description": "Explore lab computers, monitoring, maintenance controls, and permitted session management."
    },
    "hod": {
        "email": "hod.cs@campus.edu",
        "name": "Dr. Rajesh Iyer",
        "label": "Department HOD",
        "description": "Explore department overview, student approval workflows, and relevant reports."
    },
    "institution_admin": {
        "email": "admin@campus.edu",
        "name": "Dean K. Varma",
        "label": "Institution Admin",
        "description": "Explore institution-level monitoring, computer registration, credit policies, and audit logs."
    },
    "technical_admin": {
        "email": "techadmin@campus.edu",
        "name": "SysAdmin Vikram",
        "label": "Technical Admin",
        "description": "Explore technical grid administration, node health diagnostics, and developer API references."
    }
}

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
def register_student(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    # Check roll number
    existing_roll = db.query(StudentProfile).filter(StudentProfile.roll_number == req.roll_number).first()
    if existing_roll:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Roll number is already registered")

    if not req.agree_terms:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You must agree to campus computing terms")

    # In demo/dev mode, auto-approve student so evaluator can immediately experience compute workflow
    approval_status = "approved" if settings.DEMO_MODE else "pending"

    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=Role.STUDENT, # strictly student
        status="active",
        email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = StudentProfile(
        user_id=user.id,
        roll_number=req.roll_number,
        department_id=req.department_id,
        academic_year=req.academic_year,
        approval_status=approval_status
    )
    db.add(profile)
    
    # Initialize student's credit balance
    get_or_create_credit_account(db, user.id)

    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )

@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended or pending")

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-accounts", response_model=List[DemoAccountInfo])
def get_demo_accounts():
    """Lists available demo roles for platform evaluation without exposing credentials."""
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo account discovery is disabled in this environment."
        )
    return [
        DemoAccountInfo(
            role=k,
            label=v["label"],
            name=v["name"],
            email=v["email"],
            description=v["description"]
        )
        for k, v in ALLOWED_DEMO_ROLES.items()
    ]

@router.post("/demo-login", response_model=TokenResponse)
def demo_login(req: DemoLoginRequest, db: Session = Depends(get_db)):
    """Authenticates the visitor into an isolated demonstration environment for the requested role."""
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo login is disabled in this environment."
        )

    role_key = req.role.lower().strip()
    if role_key not in ALLOWED_DEMO_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid demo role '{req.role}'. Permitted roles: {list(ALLOWED_DEMO_ROLES.keys())}"
        )

    info = ALLOWED_DEMO_ROLES[role_key]
    user = db.query(User).filter(User.email == info["email"]).first()

    # If database was not seeded or demo account is missing, ensure the demo account exists
    if not user:
        default_pw = get_password_hash("password123")
        user = User(
            email=info["email"],
            hashed_password=default_pw,
            full_name=info["name"],
            role=role_key,
            status="active",
            email_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        if role_key == "student":
            dept = db.query(Department).first()
            dept_id = dept.id if dept else "dept-cse"
            db.add(StudentProfile(
                user_id=user.id,
                roll_number="22CS101",
                department_id=dept_id,
                academic_year="3rd Year B.Tech",
                approval_status="approved"
            ))
            db.add(CreditAccount(
                user_id=user.id,
                daily_allowance=100,
                current_balance=78,
                reserved_credits=0,
                last_reset_date="2026-10-17"
            ))
            db.commit()

    token = create_access_token(
        {"sub": user.id, "role": user.role, "is_demo": True},
        expires_delta=timedelta(minutes=60)
    )
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )
