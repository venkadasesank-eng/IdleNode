import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Float
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def gen_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Institution(Base):
    __tablename__ = "institutions"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    domain = Column(String, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    
    departments = relationship("Department", back_populates="institution", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    
    institution = relationship("Institution", back_populates="departments")
    labs = relationship("Lab", back_populates="department", cascade="all, delete-orphan")

class Lab(Base):
    __tablename__ = "labs"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    name = Column(String, nullable=False)
    room_number = Column(String, nullable=True)
    capacity = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    
    department = relationship("Department", back_populates="labs")
    computers = relationship("Computer", back_populates="lab", cascade="all, delete-orphan")

class Computer(Base):
    __tablename__ = "computers"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    lab_id = Column(String, ForeignKey("labs.id"), nullable=False)
    safe_identifier = Column(String, unique=True, nullable=False) # e.g. "NODE-CS-LAB1-01" (student visible)
    hostname = Column(String, nullable=False)
    ip_address = Column(String, nullable=True) # internal only, never exposed to students
    os_name = Column(String, default="Ubuntu 24.04 LTS")
    cpu_model = Column(String, default="AMD EPYC 7763 / Intel Xeon")
    cpu_cores = Column(Integer, default=16)
    ram_gb = Column(Integer, default=64)
    gpu_model = Column(String, nullable=True) # e.g. "NVIDIA RTX 4080 16GB"
    gpu_vram_gb = Column(Integer, default=0)
    storage_gb = Column(Integer, default=512)
    
    # State: available, busy, reserved, maintenance, offline
    status = Column(String, default="available")
    last_heartbeat = Column(DateTime, default=utc_now)
    agent_version = Column(String, default="1.0.0")
    supported_workloads = Column(String, default="general,development,data_science,ml_gpu,simulation")
    
    created_at = Column(DateTime, default=utc_now)
    
    lab = relationship("Lab", back_populates="computers")
    sessions = relationship("ComputeSession", back_populates="computer")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    
    # Role: student, lab_assistant, hod, institution_admin, technical_admin (Strict 1 role per user)
    role = Column(String, nullable=False)
    
    # Account status: pending, active, suspended, rejected
    status = Column(String, default="active")
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    staff_profile = relationship("StaffProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    credit_account = relationship("CreditAccount", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("ComputeSession", back_populates="student")
    files = relationship("FileItem", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    roll_number = Column(String, unique=True, nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    academic_year = Column(String, default="3rd Year")
    approval_status = Column(String, default="pending") # pending, approved, rejected
    approved_by_id = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department")

class StaffProfile(Base):
    __tablename__ = "staff_profiles"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    designation = Column(String, default="Lab Assistant / Faculty")
    assigned_lab_ids = Column(Text, default="[]") # JSON list of lab IDs
    
    user = relationship("User", back_populates="staff_profile")
    department = relationship("Department")

class ComputeSession(Base):
    __tablename__ = "compute_sessions"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    computer_id = Column(String, ForeignKey("computers.id"), nullable=True)
    workload_type = Column(String, nullable=False) # general, development, data_science, ml_gpu, simulation
    
    # Lifecycle: requested, queued, allocating, starting, connecting, active, disconnected, reconnecting, stopping, completed, failed, cancelled
    status = Column(String, default="requested")
    queue_position = Column(Integer, nullable=True)
    
    requested_minutes = Column(Integer, default=60)
    actual_minutes = Column(Integer, default=0)
    credit_rate = Column(Integer, default=10) # credits per hour
    credits_reserved = Column(Integer, default=10)
    credits_consumed = Column(Integer, default=0)
    
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    reconnect_deadline = Column(DateTime, nullable=True)
    termination_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    student = relationship("User", back_populates="sessions")
    computer = relationship("Computer", back_populates="sessions")

class CreditAccount(Base):
    __tablename__ = "credit_accounts"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    daily_allowance = Column(Integer, default=100)
    current_balance = Column(Integer, default=100)
    reserved_credits = Column(Integer, default=0)
    last_reset_date = Column(String, nullable=False) # YYYY-MM-DD
    
    user = relationship("User", back_populates="credit_account")
    transactions = relationship("CreditTransaction", back_populates="account", cascade="all, delete-orphan")

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    account_id = Column(String, ForeignKey("credit_accounts.id"), nullable=False)
    amount = Column(Integer, nullable=False) # +/- credits
    balance_after = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    session_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    account = relationship("CreditAccount", back_populates="transactions")

class FileItem(Base):
    __tablename__ = "file_items"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    session_id = Column(String, nullable=True)
    filename = Column(String, nullable=False)
    safe_path = Column(String, nullable=False)
    size_bytes = Column(Integer, default=0)
    storage_type = Column(String, default="persistent") # persistent or temporary
    created_at = Column(DateTime, default=utc_now)
    
    user = relationship("User", back_populates="files")

class OperatingSchedule(Base):
    __tablename__ = "operating_schedules"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    institution_id = Column(String, nullable=True)
    department_id = Column(String, nullable=True)
    open_time = Column(String, default="08:00")
    close_time = Column(String, default="20:00")
    days_of_week = Column(String, default="1,2,3,4,5") # Mon-Fri
    timezone = Column(String, default="Asia/Kolkata")
    is_maintenance = Column(Boolean, default=False)
    maintenance_message = Column(String, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, default="info") # info, warning, success, error
    is_read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    actor_id = Column(String, nullable=False)
    actor_email = Column(String, nullable=False)
    actor_role = Column(String, nullable=False)
    action = Column(String, nullable=False) # e.g. "APPROVE_STUDENT", "TERMINATE_SESSION"
    target_type = Column(String, nullable=False) # "USER", "SESSION", "COMPUTER", "POLICY"
    target_id = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
