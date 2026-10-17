from typing import Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.core.security import decode_access_token, Role
from backend.app.models.entities import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.status != "active" and user.status != "pending":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled or suspended")
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires role in {allowed_roles}, your role is {current_user.role}"
            )
        return current_user
    return role_checker

# Convenience role guards
require_student = require_role([Role.STUDENT])
require_staff = require_role(Role.STAFF)
require_lab_assistant = require_role([Role.LAB_ASSISTANT, Role.HOD, Role.INSTITUTION_ADMIN, Role.TECHNICAL_ADMIN])
require_hod = require_role([Role.HOD, Role.INSTITUTION_ADMIN, Role.TECHNICAL_ADMIN])
require_institution_admin = require_role([Role.INSTITUTION_ADMIN, Role.TECHNICAL_ADMIN])
require_tech_admin = require_role([Role.TECHNICAL_ADMIN])
