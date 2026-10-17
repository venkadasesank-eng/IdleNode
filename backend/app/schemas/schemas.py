from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str

class UserRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    roll_number: str
    department_id: str
    academic_year: str = "3rd Year"
    agree_terms: bool

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: str
    role: str
    status: str
    email_verified: bool
    created_at: datetime

class StudentApprovalRequest(BaseModel):
    approved: bool
    reason: Optional[str] = None

class ComputeRequestCreate(BaseModel):
    workload_type: str = "general" # general, development, data_science, ml_gpu, simulation
    min_cpu_cores: int = 4
    min_ram_gb: int = 16
    require_gpu: bool = False
    requested_minutes: int = Field(ge=5, le=480, default=60)
    application_profile: Optional[str] = "Default IDE + Compiler"

class ComputerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    safe_identifier: str
    lab_id: str
    lab_name: Optional[str] = None
    department_name: Optional[str] = None
    os_name: str
    cpu_model: str
    cpu_cores: int
    ram_gb: int
    gpu_model: Optional[str] = None
    gpu_vram_gb: int
    storage_gb: int
    status: str # available, in_use, reserved, maintenance, offline
    supported_workloads: str
    last_heartbeat: datetime

class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    student_id: str
    computer_id: Optional[str] = None
    safe_identifier: Optional[str] = None
    workload_type: str
    status: str # requested, queued, allocating, starting, connecting, active, disconnected, reconnecting, stopping, completed, failed, cancelled
    queue_position: Optional[int] = None
    requested_minutes: int
    actual_minutes: int
    credit_rate: int
    credits_consumed: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    reconnect_deadline: Optional[datetime] = None
    termination_reason: Optional[str] = None
    created_at: datetime

class SessionStopRequest(BaseModel):
    reason: str = "User initiated end of session"

class CreditTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    amount: int
    balance_after: int
    reason: str
    session_id: Optional[str] = None
    created_at: datetime

class CreditAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    daily_allowance: int
    current_balance: int
    reserved_credits: int
    last_reset_date: str
    transactions: List[CreditTransactionResponse] = []

class FileItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    filename: str
    size_bytes: int
    storage_type: str
    created_at: datetime

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    actor_email: str
    actor_role: str
    action: str
    target_type: str
    target_id: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

class DashboardMetricsResponse(BaseModel):
    active_compute_nodes: int
    total_compute_nodes: int
    current_queue_tasks: int
    avg_queue_wait_minutes: float
    daily_balance: int
    daily_allowance: int
    grid_online: bool
    recent_activity: List[str] = []
