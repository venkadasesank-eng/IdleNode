# IdleNode — Security, Isolation & Privacy Architecture

## 1. Zero Trust Principles

1. **One Account, Exactly One Role:**
   - Role escalation or role switching is strictly forbidden at the backend.
   - Roles are encoded into tamper-proof JWT tokens signed with `HS256`.
   - Role checks are performed by backend dependencies (`require_student`, `require_lab_assistant`, `require_hod`, `require_institution_admin`) on every single protected endpoint.

2. **Compute Consumer Exclusivity:**
   - **Only approved students** are permitted to consume computing resources (`/api/student/requests`).
   - Lab assistants, HODs, Institution Administrators, and Technical Administrators cannot allocate machines or consume credits for personal compute.
   - Any attempt by staff to create a compute session receives an immediate `403 Forbidden` response.

3. **Student Privacy & Storage Isolation:**
   - Student files are stored under private paths (`/storage/persistent/{student_id}/`).
   - All file operations check the authenticated `current_user.id`.
   - Path traversal attacks (e.g. `../../etc/passwd` or `..\..\windows`) are systematically neutralized by strict filename sanitization.
   - Higher administrative authority does NOT grant unrestricted access to student file contents.

## 2. Worker Agent Security

- **No Public Port Exposure:** Authorized lab computers never expose raw RDP (3389) or SSH (22) ports to the public internet.
- **Outbound Communication Only:** Worker agents dial out to the controller over TLS.
- **Automated Sandbox Teardown:**
  - Upon session termination, the worker agent recursively wipes temporary session directories.
  - Temporary processes are killed with `SIGTERM` / `SIGKILL`.
  - The node is restored to an immutable clean state before being returned to the available pool.

## 3. Disconnect Grace Period & Crash Resilience

- If a student's browser closes or internet drops:
  - The session state transitions to `disconnected`.
  - A 5-minute grace period begins (`DISCONNECT_GRACE_PERIOD_SECONDS = 300`).
  - If the student reconnects within 5 minutes, their workspace resumes with zero work lost.
  - If the grace period expires, the session is cleanly finalized, credits are calculated, and the machine is released to the queue.

## 4. Auditing & Consequential Action Logging

- Consequential operations require documented reasons:
  - Terminating a student session administratively requires a reason.
  - Placing a node into maintenance requires a reason.
  - Rejecting a student registration requires a reason.
- All actions are committed to an immutable `audit_logs` database table capturing actor email, role, target, details, IP address, and timestamp.
