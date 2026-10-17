# IdleNode — Private Campus-Powered Computing Platform

> **"Your Campus. Your Compute. Anywhere."**  
> Access powerful campus computing resources directly from your web browser. Work on demanding software development, simulation, and AI/ML workloads without an expensive personal workstation.

---

## 1. Visual Identity & Design System

IdleNode features a **monochrome liquid-glass and space design system**:
- **Nearly black background:** `#030306` with fine white dots forming a subtle space-like grid.
- **Mandatory Supplied Background Animation:** Integrated at `public/videos/idlenode-background.mp4` with a fixed, loop, muted, pointer-events: none layer behind translucent frosted panels.
- **Liquid Glass Surfaces:** `backdrop-filter: blur(28px)`, layered reflective borders (`rgba(255, 255, 255, 0.09)`), specular edge highlights (`inset 0 1px 1px rgba(255,255,255,0.14)`), and rounded corners.
- **Typography:** `Inter` for interface and navigation; `JetBrains Mono` for node identifiers, telemetry numbers, terminal logs, and technical diagnostics.
- **Icons:** Consistent `lucide-react` iconography.

---

## 2. Core Subsystems

```text
idlenode/
  public/
    videos/idlenode-background.mp4  # Exact supplied animated MP4
    images/idlenode-reference.png   # Liquid glass UI reference image
  src/
    components/
      ui/                           # GlassCard, MetricCard, TerminalPanel, ConfirmModal
      layout/                       # BackgroundVideo, GlassHeader, GlassSidebar
      student/                      # StudentOverview, StartComputing, RemoteWorkspace, MySessions, MyFiles, CreditsUsage
      staff/                        # LabAssistantDashboard, HodDashboard, InstitutionAdminDashboard
      public/                       # LandingPage, AuthModal
    services/
      api.ts                        # Typed REST & WebSocket client with auth & fallback
    styles.css                      # Liquid glass design tokens & responsive CSS
    App.tsx                         # Main role-based application shell
  backend/
    app/
      api/                          # Auth, Student, Lab Assistant, HOD, Admin, Worker
      core/                         # Config, Security (bcrypt/JWT), Database, Seeder
      models/                       # SQLAlchemy entities (User, Session, Computer, CreditAccount, etc.)
      schemas/                      # Pydantic validation schemas
      services/                     # Scheduler, Credits, Storage
      websocket/                    # Authenticated telemetry streaming
      main.py                       # FastAPI application with lifespan & CORS
    tests/                          # Pytest automated test suite (8 tests)
    requirements.txt                # Python backend dependencies
  worker-agent/
    src/agent.py                    # Worker daemon: telemetry, heartbeats, sandbox isolation
    tests/test_agent.py             # Worker agent unit tests (2 tests)
  docs/
    architecture.md                 # System architecture and data flow
    setup.md                        # Step-by-step local setup guide
    security.md                     # Security, privacy, and zero-trust boundaries
    deployment.md                   # Live campus deployment & Guacamole integration
    api.md                          # Complete REST & WebSocket API specification
    user-guide.md                   # User manuals for all 4 roles
  .env.example                      # Configuration placeholders
  package.json                      # Full-stack scripts & dependencies
```

---

## 3. Strict Role-Based Access Control

All users enter through **one unified website and one login system**. Each account has exactly one authoritative role determined by the server:

1. **Student:** The **only** role permitted to allocate resources and consume compute credits. Operates the browser remote desktop.
2. **Lab Assistant:** Supervises assigned labs, views real-time telemetry, toggles maintenance mode, and stops runaway sessions with required audit reason. **Cannot consume compute.**
3. **Department HOD:** Reviews and approves/rejects pending student compute applications with recorded reasons. Monitors department nodes. **Cannot consume compute.**
4. **Institution Administrator:** Configures daily credit allowances (default 100), midnight reset schedule (`Asia/Kolkata`), workload hourly rates, and inspects the immutable audit log. **Cannot consume compute.**
5. **Technical Administrator:** Manages low-level worker agent registrations and platform health.

---

## 4. Quickstart Commands

### 1. Install Dependencies
```powershell
# Frontend dependencies
npm.cmd install

# Backend dependencies
python -m pip install -r backend/requirements.txt
```

### 2. Start Services
```powershell
# Start Backend Controller (FastAPI on http://127.0.0.1:8000)
npm run dev:backend

# Start Frontend (Vite on http://localhost:5173)
npm.cmd run dev

# Start Worker Agent (Optional background telemetry daemon)
npm run dev:worker
```

### 3. Run Automated Tests
```powershell
# Run all tests (Frontend + Backend + Worker Agent)
npm.cmd run test:all

# Run Frontend Vitest Suite (31 tests)
npm.cmd test

# Run Backend Pytest Suite (10 tests)
npm.cmd run test:backend
```

### 4. Build Production Bundle
```powershell
npm.cmd run build
```

---

## 5. Evaluation & Demo Accounts

For immediate evaluation, use the **1-Click Demo Selector** inside the web interface or log in with:

| Role | Email | Password |
|---|---|---|
| **Student** | `student@campus.edu` | `password123` |
| **Lab Assistant** | `labtech@campus.edu` | `password123` |
| **Department HOD** | `hod.cs@campus.edu` | `password123` |
| **Institution Admin** | `admin@campus.edu` | `password123` |
| **Technical Admin** | `techadmin@campus.edu` | `password123` |

---

## 6. Truthful Disclosure of External Infrastructure

- **Local Development Mode:** The application runs locally with full UI, state machines, atomic scheduling, fair queues, credit transactions, and interactive sandbox terminal emulation.
- **Physical Lab Streaming:** Streaming real physical laboratory displays in a live collegiate deployment requires deploying the **Apache Guacamole daemon (`guacd`)** and registering the **IdleNode Worker Agent** on physical lab computers with institutional IT approval.
