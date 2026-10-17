# IdleNode — Complete User & Administrator Guide

## 1. Student Guide

### Getting Started
1. Open the IdleNode portal. Click **"Get Started"** or **"Sign In"**.
2. If new, register with your full name, college email, roll number, and department. Once approved by your HOD, your account activates with **100 daily credits**.
3. For immediate development review, click **"1-Click Demo"** and select **"Student (Aarav Sharma)"**.

### Requesting Computing Resources
1. Navigate to **"Start Computing"** in the sidebar.
2. Select your workload profile:
   - **General Desktop (5 cr/hr):** Lightweight web tools, document preparation.
   - **Programming & Systems (8 cr/hr):** C++, Java, Rust, Docker toolchain.
   - **Data Science (12 cr/hr):** Python Jupyter, Pandas, scikit-learn.
   - **Deep Learning / ML GPU (25 cr/hr):** PyTorch, CUDA, NVIDIA RTX 4080/4090.
   - **CAD & Simulation (18 cr/hr):** High-throughput modeling and simulation.
3. Configure your required minimum CPU cores and RAM.
4. Click **"Allocate Computing Resources"**. If a node is free, it is reserved atomically. If all matching machines are busy, your request is placed in the fair queue.

### Using the Remote Desktop
- Click **"Launch Remote Desktop"** or navigate to **"Remote Workspace"**.
- View your active machine in a full browser viewport with a clean liquid-glass toolbar.
- Run commands in the live terminal sandbox (`nvidia-smi`, `gcc --version`, `python3`).
- Controls: Enter fullscreen, inspect live latency diagnostics, disconnect temporarily (5-minute grace period), or end your session.

### Managing Private Files & Storage
- Open **"My Projects & Files"**.
- Files placed in **Persistent Storage** (up to 5.0 GB) persist across all sessions.
- Files placed in **Temporary Scratch** expire 24 hours after session completion.

---

## 2. Lab Assistant Guide

> **Note:** Lab Assistants supervise resources and student workloads; they do not have personal compute privileges.

### Live Telemetry & Monitoring
1. Log in with your staff account (or select **"Lab Assistant (Pooja Patel)"**).
2. The **Live Telemetry** dashboard displays the real-time operational status, CPU, RAM, and GPU utilization for every computer in your assigned labs.

### Node Maintenance
- If a computer requires hardware servicing or cleaning, click **"Set Maint"**.
- The machine is marked `maintenance` and temporarily excluded from student allocations.

### Terminating Runaway Sessions
- If a student workload exceeds scheduled hours or enters an abusive loop, click **"Stop Runaway Session"**.
- Enter an explicit reason for the institutional audit log. The session will be safely terminated and the student notified.

---

## 3. Department HOD Guide

### Student Registration Approvals
1. Log in with your HOD credentials (or select **"HOD (Dr. Rajesh Iyer)"**).
2. Under **"Student Approvals"**, review pending student registration requests.
3. Inspect the student's roll number, academic year, and verified email.
4. Click **"Approve"** to grant daily compute credits, or **"Reject"** with a documented reason.

### Department Resource Governance
- Monitor total student compute demand, computer utilization percentages, and academic session history.

---

## 4. Institution Administrator Guide

### Credit Policy Configuration
1. Navigate to **"Credit Policies"**.
2. Modify the **Daily Allowance per Student** (default 100).
3. Adjust the **Midnight Reset Schedule** and campus timezone (`Asia/Kolkata`).
4. Calibrate the hourly credit consumption rates for each workload tier.

### Inventory Enrollment
1. Open **"Node Inventory"**.
2. Register newly installed lab workstations by entering the safe identifier, internal hostname, processor specs, RAM, and GPU models.

### Compliance & Audit Trail
- View the immutable **Audit Trail** capturing every administrative action, timestamp, actor email, and target resource.
