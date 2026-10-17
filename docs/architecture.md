# IdleNode — System Architecture & Data Flow

## 1. Architectural Vision

IdleNode connects college students directly to authorized campus laboratory computers via a secure, encrypted browser remote desktop session. The system eliminates the hardware bottleneck for students working on data science, simulation, compiler development, and deep learning workloads.

```
                      +---------------------------------------+
                      |       Student Web Browser             |
                      |  - Liquid Glass UI (React/TS/Vite)    |
                      |  - Encrypted Remote Viewport Stream   |
                      +-------------------+-------------------+
                                          |
                        HTTPS (REST) / WSS (WebSocket)
                                          |
                      +-------------------v-------------------+
                      |      IdleNode Campus Controller       |
                      |  - FastAPI Application Server         |
                      |  - JWT Role-Based Authorization       |
                      |  - Atomic Resource Matching Scheduler |
                      |  - Daily Credit Metering Engine       |
                      |  - PostgreSQL / SQLite Database       |
                      +-------------------+-------------------+
                                          |
                    Internal Campus LAN / Guacamole Protocol
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
+-------v-------------------------+                       +-----------------v---------------+
|  Lab Computer 1 (AI/ML Lab)     |                       |  Lab Computer 2 (HPC Lab)       |
|  - Worker Agent Daemon (Python) |                       |  - Worker Agent Daemon (Python) |
|  - Process & Sandbox Isolation  |                       |  - Process & Sandbox Isolation  |
|  - Real Telemetry (CPU/RAM/GPU) |                       |  - Real Telemetry (CPU/RAM/GPU) |
|  - Automatic Teardown Cleanup   |                       |  - Automatic Teardown Cleanup   |
+---------------------------------+                       +---------------------------------+
```

## 2. Core Subsystems

### 2.1 Frontend Client (`src/`)
- **Technology:** React 19, TypeScript (strict checking), Vite, Lucide React.
- **Design Identity:** Liquid Glass & Space theme matching the visual specification.
  - `#030306` nearly black background.
  - Exact supplied background animation MP4 (`idlenode-background.mp4`).
  - Subtle space grid with fine white dots.
  - Layered translucent glass panels with specular reflections and backdrop blur.
  - Minimal monochrome typography (Inter + JetBrains Mono).
- **Role Scoping:** Evaluates server-issued JWT roles to render role-specific navigation and prevent cross-role UI leaks.

### 2.2 Backend Controller (`backend/app/`)
- **Technology:** Python 3.12, FastAPI, SQLAlchemy 2, SQLite/PostgreSQL, WebSockets, bcrypt, python-jose.
- **Strict Role Model:** 1 role per user account:
  - `student`: The only authorized compute consumer.
  - `lab_assistant`: Supervises assigned labs, views real-time telemetry, marks maintenance, stops runaway sessions with required audit reason.
  - `hod`: Department administrator reviewing pending student compute registrations and departmental inventory.
  - `institution_admin`: Manages institutional policies (credit allowance, reset time, workload rates) and audit logs.
  - `technical_admin`: Infrastructure lead managing worker tokens and low-level agent connectivity.
- **Fair Scheduler:** Atomic computer matching preventing race conditions, queue position tracking, and automatic queue promotion when machines become available.
- **Credit Metering Engine:** Transparent integer credits, daily reset at configured time (`Asia/Kolkata`), non-rollover expiry, auditable debit ledger.

### 2.3 Worker Agent (`worker-agent/`)
- **Technology:** Python daemon running as a system service on authorized lab computers.
- **Responsibilities:**
  - Reports hardware telemetry (CPU%, RAM%, GPU VRAM) via periodic authenticated heartbeat.
  - Prepares isolated student session sandbox directory.
  - Enforces automatic post-session teardown and resets environment after disconnect grace period.
  - Never exposes public SSH/RDP ports; all communication is outbound to controller or gateway.

### 2.4 Remote Desktop Gateway Abstraction
- Supports Apache Guacamole (`guacd`) or WebRTC/VNC protocol tunnels.
- Streams screen video and multiplexes keyboard/mouse input directly in the HTML5 canvas.
- Disconnect grace period (default 5 minutes): preserves computation if internet connection drops temporarily.
