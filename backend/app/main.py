from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, Base, engine
import backend.app.models # ensures all tables are registered in Base.metadata
from backend.app.core.seed import seed_database
from backend.app.api import auth, student, lab_assistant, hod, admin, worker
from backend.app.websocket import router as ws_router

OPENAPI_DESCRIPTION = """
# IdleNode Campus Computing Grid Controller API

Welcome to the **IdleNode Engine API Documentation**. 

IdleNode is a private, campus-powered computing platform that connects authorized college students to high-performance laboratory computers through low-latency in-browser remote streaming.

---

### Why Does the Platform Need This API?
The frontend web application uses this API to safely orchestrate student compute sessions without ever exposing internal campus laboratory IP addresses, RDP, or SSH ports to public networks. The API handles:
1. **Zero-Trust Role-Based Access Control (RBAC):** Strict isolation ensuring only verified students can consume compute resources, while staff supervise safely.
2. **Atomic Scheduler & Fair Queuing:** Locks idle lab PCs atomically to prevent double-allocation and maintains an equitable FIFO wait queue.
3. **Credit Ledger:** Grants and tracks daily computing allowances (default 100 credits/day) deducted by session duration and hardware tier.
4. **Hardware Telemetry Sync:** Ingests live worker agent heartbeats (CPU, RAM, GPU utilization) to ensure accurate allocation.

---

### Role-Based Access Control (RBAC) Matrix

| Role | Compute Workspaces | View Hardware Telemetry | Student Approvals | Credit Policies | Node Registration | Audit Trail |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Student** | **YES** | Own Sessions Only | No | View Balance | No | No |
| **Lab Assistant** | No | Assigned Labs Only | No | No | No | Read Recent |
| **Head of Department (HOD)** | No | Department Labs | **YES** | View Dept | No | Read Dept |
| **Institution Administrator** | No | All Campus Nodes | High-Level | **YES** | **YES** | **Full Audit** |
| **Worker Agent** | Daemon | Reports Heartbeats | No | No | Auto-Register | Heartbeat Ack |

---

### Quick Getting Started Guide (5 Steps)

1. **Verify API Health:**
   Send a GET request to `/api/health` to confirm the controller grid is online.
   ```bash
   curl -X GET http://127.0.0.1:8000/api/health
   ```

2. **Authenticate with Demo Credentials:**
   Send a POST request to `/api/v1/auth/login` to obtain an access token.
   - Student: `student@campus.edu` / `password123`
   - Lab Assistant: `labtech@campus.edu` / `password123`
   - HOD: `hod.cs@campus.edu` / `password123`
   - Admin: `admin@campus.edu` / `password123`
   ```bash
   curl -X POST http://127.0.0.1:8000/api/v1/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email":"student@campus.edu","password":"password123"}'
   ```

3. **Authorize in Swagger UI:**
   Copy the `access_token` string from the login response. Click the **Authorize 🔓** button at the top right of this Swagger page, type `Bearer <YOUR_TOKEN>`, and click **Authorize**.

4. **Request Compute Hardware (Students):**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/v1/student/requests \\
     -H "Authorization: Bearer <YOUR_TOKEN>" \\
     -H "Content-Type: application/json" \\
     -d '{"workload_profile":"development","requested_duration_minutes":60,"min_cpu_cores":8,"min_ram_gb":32,"require_gpu":false}'
   ```

5. **Read the Response:**
   If a matching node is idle, status returns `"allocating"` or `"active"`. If all matching lab nodes are occupied, the scheduler returns `"queued"` with position and estimated wait time.
"""

TAGS_METADATA = [
    {
        "name": "System Health",
        "description": "Liveness and cluster readiness probes for load balancers and frontend health indicators.",
    },
    {
        "name": "Authentication",
        "description": "Institutional single-sign-on, student registration with roll verification, and JWT session issuance.",
    },
    {
        "name": "Student Compute",
        "description": "Endpoints restricted strictly to students: requesting compute hardware, connecting to workspaces, managing persistent files, and credit balances.",
    },
    {
        "name": "Lab Supervision",
        "description": "Endpoints for laboratory technicians: inspecting assigned laboratory computer inventory, toggling maintenance mode, and terminating stuck sessions.",
    },
    {
        "name": "Department Administration",
        "description": "Endpoints for Department Heads (HODs): reviewing pending student registrations, inspecting department node occupancy, and department-level policies.",
    },
    {
        "name": "Institution Administration",
        "description": "Administrative endpoints for Dean / Director: configuring campus credit policies, registering new laboratory hardware, and inspecting immutable audit trails.",
    },
    {
        "name": "Worker Agent",
        "description": "Daemon communication endpoints running locally on physical laboratory computers to report hardware telemetry and sync active session lifecycle.",
    },
    {
        "name": "WebSockets",
        "description": "Real-time bidirectional streams broadcasting cluster state changes and node telemetry.",
    },
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if settings.DEMO_MODE:
            seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="IdleNode Campus Computing Grid Controller API",
    version=settings.VERSION,
    description=OPENAPI_DESCRIPTION,
    openapi_tags=TAGS_METADATA,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers with explicit OpenAPI tags
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(student.router, prefix=f"{settings.API_V1_STR}/student", tags=["Student Compute"])
app.include_router(lab_assistant.router, prefix=f"{settings.API_V1_STR}/lab-assistant", tags=["Lab Supervision"])
app.include_router(hod.router, prefix=f"{settings.API_V1_STR}/hod", tags=["Department Administration"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Institution Administration"])
app.include_router(worker.router, prefix=f"{settings.API_V1_STR}/worker", tags=["Worker Agent"])
app.include_router(ws_router.router, tags=["WebSockets"])

@app.get("/api/health", tags=["System Health"], summary="Cluster Liveness & Health Probe")
def health_check():
    """Returns cluster controller operational status, semantic version, and grid state."""
    return {
        "status": "healthy",
        "service": "idlenode-controller",
        "version": settings.VERSION,
        "grid_status": "ONLINE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
