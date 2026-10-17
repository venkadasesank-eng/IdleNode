# IdleNode — Local Setup & Development Guide

This guide walks you through setting up and running IdleNode locally.

## Prerequisites
- **Node.js**: v20+ or v24+ (v24.21.0 verified)
- **Python**: v3.11+ or v3.12+ (v3.12.10 verified)
- **Git**

---

## 1. Fast Track: Single-Command Quickstart

From the project root (`D:\IdleNode`):

### Terminal 1: Backend Controller
```powershell
python -m pip install -r backend/requirements.txt
npm run dev:backend
```
The FastAPI backend server starts on `http://127.0.0.1:8000`. On first run, it automatically seeds the database with realistic campus departments, labs, compute nodes, and pre-configured accounts for all 5 roles.

### Terminal 2: Frontend Web Client
```powershell
npm.cmd install
npm.cmd run dev
```
Open `http://localhost:5173` in your browser. The liquid glass UI with your custom animated background video will immediately load.

### Terminal 3 (Optional): Worker Agent
```powershell
npm run dev:worker
```
Starts the worker agent, which begins sending heartbeats to the local controller.

---

## 2. Pre-Configured Test Accounts (1-Click Demo Available in UI)

You can click **"Explore Demo Roles"** or **"Switch Role"** in the top navigation to instantly log in as any role:

| Role | Email | Password | Responsibilities |
|---|---|---|---|
| **Student** | `student@campus.edu` | `password123` | Request compute, operate remote desktop, view private files & credits |
| **Lab Assistant** | `labtech@campus.edu` | `password123` | Monitor assigned labs, inspect live node telemetry, set maintenance mode |
| **Department HOD** | `hod.cs@campus.edu` | `password123` | Review & approve pending student registrations, inspect departmental nodes |
| **Institution Admin**| `admin@campus.edu` | `password123` | Configure credit policies, rates, and inspect system audit trail |
| **Technical Admin** | `techadmin@campus.edu` | `password123` | Manage low-level worker agent registrations and platform health |

---

## 3. Running Automated Test Suites

### Run All Tests (Frontend + Backend + Worker Agent)
```powershell
npm.cmd run test:all
```

### Run Frontend Vitest Suite Only
```powershell
npm.cmd test
```

### Run Backend Pytest Suite Only
```powershell
npm.cmd run test:backend
```

### Production Build & Strict TypeScript Type Check
```powershell
npm.cmd run build
```
Generates production build in `dist/` with 0 warnings.
