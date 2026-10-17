from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, get_current_user
from backend.app.core.config import settings
from backend.app.core.security import verify_password, get_password_hash, create_access_token, Role
from backend.app.models.entities import User, StudentProfile, CreditAccount, Department, AuditLog
from backend.app.schemas.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from backend.app.services.credit_service import get_or_create_credit_account

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

@router.get("/demo-accounts")
def get_demo_accounts():
    """Lists pre-configured accounts across all roles for immediate testing."""
    return [
        {"role": "student", "label": "Student", "email": "student@campus.edu", "password": "password123", "name": "Aarav Sharma"},
        {"role": "lab_assistant", "label": "Lab Assistant", "email": "labtech@campus.edu", "password": "password123", "name": "Pooja Patel"},
        {"role": "hod", "label": "Department HOD", "email": "hod.cs@campus.edu", "password": "password123", "name": "Dr. Rajesh Iyer"},
        {"role": "institution_admin", "label": "Institution Admin", "email": "admin@campus.edu", "password": "password123", "name": "Dean K. Varma"},
        {"role": "technical_admin", "label": "Technical Admin", "email": "techadmin@campus.edu", "password": "password123", "name": "SysAdmin Vikram"}
    ]
