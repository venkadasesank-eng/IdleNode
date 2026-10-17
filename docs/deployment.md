# IdleNode — Live Campus Deployment & Infrastructure Guide

This document describes how to deploy IdleNode in a live collegiate laboratory network.

---

## 1. Hosting Topologies

### Tier 1: Frontend (Edge / Cloud CDN or Campus Portal)
- Can be deployed on Vercel, Cloudflare Pages, or an on-premise NGINX server.
- Built via `npm run build`.
- Configuration: Set `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` pointing to the campus controller.

### Tier 2: IdleNode Campus Controller
- Must be deployed on an on-premise server or collegiate datacenter with access to the campus laboratory LAN.
- Runs the FastAPI application with a production ASGI server:
  ```bash
  uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
  ```
- Backed by PostgreSQL:
  ```env
  DATABASE_URL=postgresql://idlenode_user:secure_password@localhost:5432/idlenode_campus
  ```

### Tier 3: Remote Desktop Gateway (Apache Guacamole)
- Deploy `guacd` (Apache Guacamole daemon) on the campus controller server:
  ```bash
  docker run --name guacd -d -p 4822:4822 guacamole/guacd
  ```
- The gateway converts RDP/VNC screen buffers into low-latency WebSocket packets streamed directly into the student's browser HTML5 canvas.

### Tier 4: Laboratory Worker Computers
- Authorized lab PCs (running Ubuntu Desktop, Windows 11 Enterprise, or Debian).
- Run the IdleNode Worker Agent as a `systemd` service (Linux) or Windows Service.

---

## 2. Worker Agent Installation on Authorized Lab Machines

> **IMPORTANT:** Worker agents must NEVER be installed on college laboratory computers without prior written authorization from the Department Head and Institutional IT Administrator.

### Linux Systemd Service Setup
1. Copy `worker-agent/` to `/opt/idlenode-worker/`.
2. Install Python dependencies:
   ```bash
   python3 -m pip install httpx psutil
   ```
3. Create `/etc/systemd/system/idlenode-worker.service`:
   ```ini
   [Unit]
   Description=IdleNode Campus Worker Agent
   After=network.target

   [Service]
   Type=simple
   User=root
   WorkingDirectory=/opt/idlenode-worker
   ExecStart=/usr/bin/python3 /opt/idlenode-worker/src/agent.py
   Restart=always
   RestartSec=10
   Environment=IDLENODE_CONTROLLER_URL=https://idlenode.campus.edu
   Environment=IDLENODE_IDENTIFIER=NODE-CSE-AI-01

   [Install]
   WantedBy=multi-user.target
   ```
4. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now idlenode-worker
   ```

---

## 3. Truthful Disclosure: Missing External Infrastructure Checklist

For this application to stream real laboratory screens in production (beyond local development mode), the institution must provide:

1. **Institutional Network Approvals:** Firewall permissions allowing outbound HTTPS/WSS from lab computers to the campus controller.
2. **Guacamole Gateway Daemon (`guacd`):** Installed and running on the campus controller.
3. **Dedicated PostgreSQL Database:** Configured for concurrent transaction handling.
4. **Physical Worker Agent Enrollment:** Installation of `agent.py` on authorized laboratory computers.
