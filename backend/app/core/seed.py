import json
from sqlalchemy.orm import Session
from backend.app.core.database import Base
from backend.app.core.security import get_password_hash, Role
from backend.app.models.entities import (
    Institution, Department, Lab, Computer, User, StudentProfile, StaffProfile, CreditAccount, CreditTransaction, AuditLog
)

def seed_database(db: Session):
    bind = db.get_bind()
    Base.metadata.create_all(bind=bind)
    
    # Check if already seeded
    if db.query(Institution).first():
        return

    print("Seeding initial IdleNode campus infrastructure...")

    # 1. Institution
    inst = Institution(
        name="Apex Engineering Institute",
        code="APEX",
        domain="campus.edu"
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)

    # 2. Departments
    dept_cs = Department(institution_id=inst.id, name="Computer Science & Engineering", code="CSE")
    dept_ai = Department(institution_id=inst.id, name="Artificial Intelligence & Data Science", code="AIDS")
    db.add_all([dept_cs, dept_ai])
    db.commit()

    # 3. Labs
    lab_ai = Lab(department_id=dept_cs.id, name="AI & Deep Learning Lab", room_number="CS-301", capacity=30)
    lab_hpc = Lab(department_id=dept_cs.id, name="High-Performance Systems Lab", room_number="CS-302", capacity=30)
    lab_gen = Lab(department_id=dept_ai.id, name="General Computing Lab", room_number="AI-101", capacity=40)
    db.add_all([lab_ai, lab_hpc, lab_gen])
    db.commit()

    # 4. Computers
    computers = [
        Computer(
            lab_id=lab_ai.id, safe_identifier="NODE-CSE-AI-01", hostname="apex-cs-ai01",
            os_name="Ubuntu 24.04 LTS", cpu_model="AMD EPYC 7763 (32 Cores)", cpu_cores=32, ram_gb=128,
            gpu_model="NVIDIA GeForce RTX 4090", gpu_vram_gb=24, storage_gb=1024, status="available",
            supported_workloads="general,development,data_science,ml_gpu,simulation"
        ),
        Computer(
            lab_id=lab_ai.id, safe_identifier="NODE-CSE-AI-02", hostname="apex-cs-ai02",
            os_name="Ubuntu 24.04 LTS", cpu_model="AMD EPYC 7763 (32 Cores)", cpu_cores=32, ram_gb=128,
            gpu_model="NVIDIA GeForce RTX 4080", gpu_vram_gb=16, storage_gb=1024, status="busy",
            supported_workloads="general,development,data_science,ml_gpu,simulation"
        ),
        Computer(
            lab_id=lab_hpc.id, safe_identifier="NODE-CSE-HPC-01", hostname="apex-cs-hpc01",
            os_name="Ubuntu 24.04 LTS", cpu_model="AMD Threadripper PRO 5995WX (64 Cores)", cpu_cores=64, ram_gb=256,
            gpu_model="Dual NVIDIA RTX A5000", gpu_vram_gb=48, storage_gb=2048, status="available",
            supported_workloads="general,development,data_science,ml_gpu,simulation"
        ),
        Computer(
            lab_id=lab_hpc.id, safe_identifier="NODE-CSE-HPC-02", hostname="apex-cs-hpc02",
            os_name="Ubuntu 24.04 LTS", cpu_model="AMD Threadripper PRO 5995WX (64 Cores)", cpu_cores=64, ram_gb=256,
            gpu_model="NVIDIA GeForce RTX 4080", gpu_vram_gb=16, storage_gb=2048, status="available",
            supported_workloads="general,development,data_science,ml_gpu,simulation"
        ),
        Computer(
            lab_id=lab_gen.id, safe_identifier="NODE-AI-GEN-01", hostname="apex-ai-gen01",
            os_name="Ubuntu 24.04 LTS", cpu_model="Intel Xeon Gold 6330 (16 Cores)", cpu_cores=16, ram_gb=64,
            gpu_model=None, gpu_vram_gb=0, storage_gb=512, status="available",
            supported_workloads="general,development,data_science"
        ),
        Computer(
            lab_id=lab_gen.id, safe_identifier="NODE-AI-GEN-02", hostname="apex-ai-gen02",
            os_name="Ubuntu 24.04 LTS", cpu_model="Intel Xeon Gold 6330 (16 Cores)", cpu_cores=16, ram_gb=64,
            gpu_model=None, gpu_vram_gb=0, storage_gb=512, status="available",
            supported_workloads="general,development,data_science"
        ),
        Computer(
            lab_id=lab_gen.id, safe_identifier="NODE-AI-GEN-03", hostname="apex-ai-gen03",
            os_name="Ubuntu 24.04 LTS", cpu_model="Intel Core i9-14900K (24 Cores)", cpu_cores=24, ram_gb=64,
            gpu_model="NVIDIA GeForce RTX 3080 Ti", gpu_vram_gb=12, storage_gb=512, status="maintenance",
            supported_workloads="general,development,data_science,ml_gpu"
        ),
    ]
    db.add_all(computers)
    db.commit()

    # 5. Seed Users across all 5 roles
    default_pw = get_password_hash("password123")
    
    # 5.1 Approved Student
    u_student = User(
        email="student@campus.edu",
        hashed_password=default_pw,
        full_name="Aarav Sharma",
        role=Role.STUDENT,
        status="active",
        email_verified=True
    )
    db.add(u_student)
    db.commit()
    db.refresh(u_student)

    db.add(StudentProfile(
        user_id=u_student.id,
        roll_number="22CS101",
        department_id=dept_cs.id,
        academic_year="3rd Year B.Tech",
        approval_status="approved"
    ))
    db.add(CreditAccount(
        user_id=u_student.id,
        daily_allowance=100,
        current_balance=78,
        reserved_credits=0,
        last_reset_date="2026-10-17"
    ))
    db.commit()

    # 5.2 Pending Student (for testing HOD approval flow)
    u_pending = User(
        email="pending.student@campus.edu",
        hashed_password=default_pw,
        full_name="Meera Nair",
        role=Role.STUDENT,
        status="pending",
        email_verified=True
    )
    db.add(u_pending)
    db.commit()
    db.refresh(u_pending)
    db.add(StudentProfile(
        user_id=u_pending.id,
        roll_number="23CS205",
        department_id=dept_cs.id,
        academic_year="2nd Year B.Tech",
        approval_status="pending"
    ))
    db.commit()

    # 5.3 Lab Assistant
    u_lab = User(
        email="labtech@campus.edu",
        hashed_password=default_pw,
        full_name="Pooja Patel",
        role=Role.LAB_ASSISTANT,
        status="active",
        email_verified=True
    )
    db.add(u_lab)
    db.commit()
    db.refresh(u_lab)
    db.add(StaffProfile(
        user_id=u_lab.id,
        department_id=dept_cs.id,
        designation="Senior Systems Technical Assistant",
        assigned_lab_ids=json.dumps([lab_ai.id, lab_hpc.id])
    ))

    # 5.4 HOD
    u_hod = User(
        email="hod.cs@campus.edu",
        hashed_password=default_pw,
        full_name="Dr. Rajesh Iyer",
        role=Role.HOD,
        status="active",
        email_verified=True
    )
    db.add(u_hod)
    db.commit()
    db.refresh(u_hod)
    db.add(StaffProfile(
        user_id=u_hod.id,
        department_id=dept_cs.id,
        designation="Professor & Head of Department"
    ))

    # 5.5 Institution Admin
    u_admin = User(
        email="admin@campus.edu",
        hashed_password=default_pw,
        full_name="Dean K. Varma",
        role=Role.INSTITUTION_ADMIN,
        status="active",
        email_verified=True
    )
    db.add(u_admin)

    # 5.6 Technical Admin
    u_tech = User(
        email="techadmin@campus.edu",
        hashed_password=default_pw,
        full_name="SysAdmin Vikram",
        role=Role.TECHNICAL_ADMIN,
        status="active",
        email_verified=True
    )
    db.add(u_tech)
    db.commit()

    # 6. Seed Initial Audit Logs
    audit_entries = [
        AuditLog(
            actor_id=u_admin.id,
            actor_email=u_admin.email,
            actor_role="institution_admin",
            action="PLATFORM_INITIALIZATION",
            target_type="PLATFORM",
            target_id="IDLENODE-CORE",
            details="Campus computing grid initialized with APEX master policy. Multi-department federation active.",
            ip_address="10.0.1.1"
        ),
        AuditLog(
            actor_id=u_admin.id,
            actor_email=u_admin.email,
            actor_role="institution_admin",
            action="REGISTER_NODE_POOL",
            target_type="COMPUTER",
            target_id="NODE-CSE-AI-01",
            details="Registered NVIDIA RTX 4090 node in AI & Deep Learning Lab (CS-301).",
            ip_address="10.0.1.1"
        ),
        AuditLog(
            actor_id=u_admin.id,
            actor_email=u_admin.email,
            actor_role="institution_admin",
            action="UPDATE_CREDIT_POLICY",
            target_type="POLICY",
            target_id="CREDIT_SETTINGS",
            details="Set daily student allowance to 100 credits. Standardized rates for ML/Simulation workloads.",
            ip_address="10.0.1.1"
        ),
        AuditLog(
            actor_id=u_hod.id,
            actor_email=u_hod.email,
            actor_role="hod",
            action="STUDENT_REGISTRATION_APPROVE",
            target_type="USER",
            target_id="22CS101",
            details="Approved academic credentials for Aarav Sharma (3rd Year B.Tech CSE).",
            ip_address="10.0.4.15"
        ),
        AuditLog(
            actor_id=u_lab.id,
            actor_email=u_lab.email,
            actor_role="lab_assistant",
            action="NODE_HEALTH_CHECK",
            target_type="COMPUTER",
            target_id="NODE-CSE-HPC-01",
            details="Dual RTX A5000 telemetry verified. CUDA compute capability checked successfully.",
            ip_address="10.0.2.22"
        ),
        AuditLog(
            actor_id=u_lab.id,
            actor_email=u_lab.email,
            actor_role="lab_assistant",
            action="MAINTENANCE_TOGGLE",
            target_type="COMPUTER",
            target_id="NODE-AI-GEN-03",
            details="Flagged for driver patch update and scheduled maintenance.",
            ip_address="10.0.2.22"
        ),
    ]
    db.add_all(audit_entries)
    db.commit()

    print("Initial seed data successfully committed!")
