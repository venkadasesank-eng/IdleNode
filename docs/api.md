# IdleNode — Complete REST & WebSocket API Reference

Base URL: `http://127.0.0.1:8000/api`

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Student self-registration | Public |
| `POST` | `/auth/login` | Authenticate with email/password; returns JWT | Public |
| `GET` | `/auth/me` | Fetch authenticated user profile & role | Bearer JWT |
| `GET` | `/auth/demo-accounts` | List pre-configured evaluation accounts | Public |

## 2. Student Compute (`/api/student`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/student/dashboard` | Real-time metrics (Active nodes, queue, balance, logs) | Student |
| `POST` | `/student/requests` | Submit compute request with workload requirements | Student |
| `GET` | `/student/sessions` | List student's own compute sessions | Student |
| `GET` | `/student/sessions/{id}` | Inspect detailed session state | Student |
| `POST` | `/student/sessions/{id}/connect` | Connect to remote workspace (transitions to active) | Student |
| `POST` | `/student/sessions/{id}/disconnect` | Disconnect (initiates 5-min grace period) | Student |
| `POST` | `/student/sessions/{id}/end` | Terminate session, finalize credits, release node | Student |
| `DELETE` | `/student/sessions/{id}/queue` | Cancel queued request, release reserved credits | Student |
| `GET` | `/student/credits` | Fetch daily allowance, balance, and transaction ledger | Student |
| `GET` | `/student/files` | List private files (`?storage_type=persistent/temporary`)| Student |
| `POST` | `/student/files/upload` | Upload file into private storage volume | Student |
| `DELETE` | `/student/files/{id}` | Delete private file | Student |
| `GET` | `/student/notifications` | Fetch student notification feed | Student |
| `POST` | `/student/notifications/{id}/read`| Mark notification as read | Student |

## 3. Lab Supervision (`/api/lab-assistant`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/lab-assistant/labs` | List assigned labs and machine counts | Lab Assistant |
| `GET` | `/lab-assistant/computers` | Inspect hardware telemetry and status of lab machines | Lab Assistant |
| `POST` | `/lab-assistant/computers/{id}/maintenance`| Toggle maintenance mode with reason | Lab Assistant |
| `POST` | `/lab-assistant/sessions/{id}/stop` | Administratively stop runaway session with reason | Lab Assistant |

## 4. Department Administration (`/api/hod`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/hod/overview` | Department-level KPIs & active workloads | HOD |
| `GET` | `/hod/students/pending` | List pending student registrations | HOD |
| `POST` | `/hod/students/{id}/review` | Approve or reject student compute registration | HOD |

## 5. Institution Administration (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/admin/overview` | Institution-wide platform health & compute metrics | Institution Admin |
| `GET` | `/admin/credit-policy` | Fetch current credit allowance, reset time, rates | Institution Admin |
| `PUT` | `/admin/credit-policy` | Update credit policies and hourly workload rates | Institution Admin |
| `POST` | `/admin/computers` | Register new laboratory workstation node | Institution Admin |
| `GET` | `/admin/audit-logs` | Fetch immutable institutional audit trail | Institution Admin |

## 6. Worker Agent Gateway (`/api/worker`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/worker/heartbeat` | Report local hardware telemetry (CPU, RAM, GPU) | Worker Token |

## 7. Real-Time WebSockets (`/ws`)

| Endpoint | Protocol | Description | Auth |
|---|---|---|---|
| `/ws/telemetry?token={jwt}` | WSS | Real-time live session telemetry stream & node updates | JWT Query Param |
| `/ws/session/{session_id}?token={jwt}` | WSS | Remote desktop stream & console output | JWT Query Param |
