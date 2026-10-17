import React, { useState, useEffect, useMemo } from 'react'
import {
  Code,
  ExternalLink,
  Shield,
  Copy,
  Check,
  Search,
  Terminal,
  Activity,
  Lock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import { API_BASE, SWAGGER_DOCS_URL } from '../../services/api'

interface ApiDocsViewProps {
  onBack?: () => void
}

interface EndpointDef {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS'
  path: string
  title: string
  category:
    | 'Authentication & Accounts'
    | 'Student Compute & Workspaces'
    | 'Laboratory Supervision'
    | 'Department Governance'
    | 'Institution Administration'
    | 'Worker Agent Daemon'
    | 'Real-Time WebSockets'
    | 'System Health Probe'
  roles: string[]
  requiresAuth: boolean
  whatItDoes: string
  whyItIsNeeded: string
  parameters?: string
  requestSample?: string
  responseSample: string
  statusCodes: { code: number; text: string }[]
  restrictions?: string
}

const ENDPOINT_CATALOG: EndpointDef[] = [
  // 1. System Health Probe
  {
    method: 'GET',
    path: '/api/health',
    title: 'Cluster Controller Health & Liveness Probe',
    category: 'System Health Probe',
    roles: ['Public / Anyone'],
    requiresAuth: false,
    whatItDoes: 'Returns the operational health, version string, and grid scheduler status of the IdleNode central controller.',
    whyItIsNeeded: 'Used by load balancers, frontend status indicators, and monitoring systems to verify the campus controller is responsive before routing student requests.',
    responseSample: JSON.stringify(
      {
        status: 'healthy',
        service: 'idlenode-controller',
        version: '1.0.0',
        grid_status: 'ONLINE'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'Grid controller is operational and ready to accept allocations' }
    ]
  },

  // 2. Authentication & Accounts
  {
    method: 'POST',
    path: '/api/auth/register',
    title: 'Student Registration with Roll Number Verification',
    category: 'Authentication & Accounts',
    roles: ['Public / New Students'],
    requiresAuth: false,
    whatItDoes: 'Registers a new student account with their verified institutional roll number, academic year, and department.',
    whyItIsNeeded: 'Enforces academic accountability. Accounts enter a pending state until verified by the corresponding Department Head (HOD).',
    parameters: 'full_name, email, password (min 6 chars), roll_number, department_id, academic_year, agree_terms',
    requestSample: JSON.stringify(
      {
        full_name: 'Aarav Sharma',
        email: 'aarav.sharma@campus.edu',
        password: 'Password123!',
        roll_number: '2023CS0142',
        department_id: 'dept-cs-01',
        academic_year: '3rd Year',
        agree_terms: true
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        id: 'usr_98f4e2ab',
        email: 'aarav.sharma@campus.edu',
        full_name: 'Aarav Sharma',
        role: 'student',
        status: 'pending_approval',
        email_verified: false,
        created_at: '2026-10-17T09:15:00Z'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 201, text: 'Student registered successfully, awaiting HOD verification' },
      { code: 400, text: 'Email or Roll Number already registered on campus grid' },
      { code: 422, text: 'Validation error: invalid email or missing required fields' }
    ],
    restrictions: 'Only student accounts can be registered publicly. Staff accounts are provisioned by Institution Administrators.'
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    title: 'Authenticate and Obtain Signed JWT Bearer Token',
    category: 'Authentication & Accounts',
    roles: ['Public / All Roles'],
    requiresAuth: false,
    whatItDoes: 'Validates student or staff institutional credentials and returns an encrypted JSON Web Token containing cryptographic role claims.',
    whyItIsNeeded: 'Provides stateless, secure API access across all compute schedulers and laboratory controllers without repeated password transmission.',
    parameters: 'email, password',
    requestSample: JSON.stringify(
      {
        email: 'student@campus.edu',
        password: 'password123'
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token_type: 'bearer',
        role: 'student',
        user_id: 'usr_1a1a2b2b',
        full_name: 'Aarav Sharma',
        email: 'student@campus.edu'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'Authentication successful, JWT token issued' },
      { code: 401, text: 'Invalid email or password' },
      { code: 403, text: 'Account pending HOD approval or suspended' }
    ]
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    title: 'Get Current Authenticated User Profile',
    category: 'Authentication & Accounts',
    roles: ['Authenticated User'],
    requiresAuth: true,
    whatItDoes: 'Returns the full identity, department, role, and active permissions of the caller based on their Bearer token.',
    whyItIsNeeded: 'Enables frontend client state hydration and verified role-based routing upon application startup.',
    responseSample: JSON.stringify(
      {
        id: 'usr_1a1a2b2b',
        email: 'student@campus.edu',
        full_name: 'Aarav Sharma',
        role: 'student',
        status: 'active',
        email_verified: true,
        created_at: '2026-09-01T08:00:00Z'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'User profile retrieved successfully' },
      { code: 401, text: 'Missing, malformed, or expired Bearer token' }
    ]
  },
  {
    method: 'GET',
    path: '/api/auth/demo-accounts',
    title: 'Fetch Seeded Evaluation Demo Accounts',
    category: 'Authentication & Accounts',
    roles: ['Public / Evaluators'],
    requiresAuth: false,
    whatItDoes: 'Provides pre-configured demo account credentials for immediate 1-click role testing across Student, Lab Tech, HOD, and Admin.',
    whyItIsNeeded: 'Allows evaluators, accreditation reviewers, and campus faculty to experience all role dashboards seamlessly.',
    responseSample: JSON.stringify(
      [
        { role: 'student', email: 'student@campus.edu', name: 'Aarav Sharma (Student)' },
        { role: 'lab_assistant', email: 'labtech@campus.edu', name: 'Pooja Verma (Lab Tech)' },
        { role: 'hod', email: 'hod.cs@campus.edu', name: 'Dr. Rajesh Rao (HOD)' },
        { role: 'institution_admin', email: 'admin@campus.edu', name: 'Dean Varma (Admin)' }
      ],
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Seeded demo credentials returned' }]
  },

  // 3. Student Compute & Workspaces
  {
    method: 'GET',
    path: '/api/student/dashboard',
    title: 'Student Dashboard Telemetry & Grid Capacity',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Returns live cluster metrics including active compute nodes, total nodes, current FIFO queue wait times, and remaining daily credit balance.',
    whyItIsNeeded: 'Provides students transparent visibility into laboratory availability before submitting computationally heavy workloads.',
    responseSample: JSON.stringify(
      {
        active_compute_nodes: 34,
        total_compute_nodes: 50,
        current_queue_tasks: 2,
        avg_queue_wait_minutes: 1.4,
        daily_balance: 78,
        daily_allowance: 100,
        grid_online: true,
        recent_activity: [
          'Compute node allocated scheduler:alloc',
          'Streaming session started gateway:stream'
        ]
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'Live telemetry calculated from cluster database' },
      { code: 401, text: 'Authentication required' },
      { code: 403, text: 'Role forbidden: Only students can access student dashboard' }
    ],
    restrictions: 'Restricted strictly to students. Staff cannot access or consume student compute resources.'
  },
  {
    method: 'POST',
    path: '/api/student/requests',
    title: 'Request Laboratory Hardware Allocation',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Submits a workload request to the atomic scheduler. If matching physical lab hardware is idle, immediately transitions to active; otherwise places in FIFO queue.',
    whyItIsNeeded: 'Guarantees fair, race-condition-free allocation of physical campus laboratory computers without dual occupancy.',
    parameters: 'workload_profile (general, development, data_science, simulation, ml_gpu), requested_duration_minutes, min_cpu_cores, min_ram_gb, require_gpu',
    requestSample: JSON.stringify(
      {
        workload_profile: 'development',
        requested_duration_minutes: 60,
        min_cpu_cores: 8,
        min_ram_gb: 32,
        require_gpu: false
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        id: 'sess_993f41bb',
        student_id: 'usr_1a1a2b2b',
        computer_id: 'node_lab1_pc04',
        safe_identifier: 'CS-LAB1-WS04',
        workload_type: 'development',
        status: 'active',
        queue_position: null,
        requested_minutes: 60,
        actual_minutes: 0,
        credit_rate: 8,
        credits_consumed: 0,
        created_at: '2026-10-17T09:30:00Z'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 201, text: 'Workstation allocated or placed in FIFO queue' },
      { code: 400, text: 'Insufficient daily credits or active session already running' },
      { code: 403, text: 'Student account not approved for compute access' }
    ]
  },
  {
    method: 'GET',
    path: '/api/student/sessions',
    title: 'List Student Compute Session History',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Retrieves current active, queued, and historical remote desktop sessions for the caller.',
    whyItIsNeeded: 'Enables students to view session durations, credit consumption, and quickly resume active streaming sessions.',
    responseSample: JSON.stringify(
      [
        {
          id: 'sess_993f41bb',
          student_id: 'usr_1a1a2b2b',
          safe_identifier: 'CS-LAB1-WS04',
          workload_type: 'development',
          status: 'active',
          requested_minutes: 60,
          actual_minutes: 14,
          credit_rate: 8,
          credits_consumed: 2,
          created_at: '2026-10-17T09:30:00Z'
        }
      ],
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Session history list returned' }]
  },
  {
    method: 'GET',
    path: '/api/student/sessions/{session_id}',
    title: 'Get Session Details & Reconnection Status',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Inspects a specific session state, allocated computer identifier, elapsed duration, and reconnect grace period deadline.',
    whyItIsNeeded: 'Verifies session health before re-establishing in-browser streaming.',
    responseSample: JSON.stringify(
      {
        id: 'sess_993f41bb',
        status: 'active',
        safe_identifier: 'CS-LAB1-WS04',
        workload_type: 'development',
        reconnect_deadline: '2026-10-17T09:45:00Z'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'Session details returned' },
      { code: 404, text: 'Session not found or does not belong to caller' }
    ]
  },
  {
    method: 'POST',
    path: '/api/student/sessions/{session_id}/connect',
    title: 'Initiate In-Browser Remote Desktop Stream Tunnel',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Handshakes the WebRTC / Guacamole streaming tunnel between the student browser and the allocated lab computer.',
    whyItIsNeeded: 'Provides zero-trust remote display rendering and binary input forwarding without exposing campus IP addresses.',
    responseSample: JSON.stringify(
      {
        status: 'connected',
        ws_stream_url: 'ws://.../ws/stream/sess_993f41bb',
        protocol: 'webrtc_h264_guac',
        fps: 60
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'Streaming gateway tunnel ready' },
      { code: 409, text: 'Computer is offline or resetting' }
    ]
  },
  {
    method: 'POST',
    path: '/api/student/sessions/{session_id}/disconnect',
    title: 'Temporarily Disconnect Stream with Grace Period',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Pauses active display streaming and starts a 15-minute reconnect timer without terminating student background processes on the lab PC.',
    whyItIsNeeded: 'Protects students from lost work caused by campus Wi-Fi drops or closing their laptop lid.',
    responseSample: JSON.stringify(
      {
        status: 'disconnected_grace',
        grace_period_seconds: 900,
        reconnect_deadline: '2026-10-17T09:45:00Z'
      },
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Grace period initiated' }]
  },
  {
    method: 'POST',
    path: '/api/student/sessions/{session_id}/end',
    title: 'Explicitly Terminate Session & Release Computer',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Ends the compute allocation, calculates final credit deductions, sanitizes the user session on the lab PC, and returns the workstation to the idle pool.',
    whyItIsNeeded: 'Allows students to preserve remaining daily credits by releasing hardware early when finished.',
    parameters: 'reason (optional string)',
    requestSample: JSON.stringify(
      {
        reason: 'Work completed early by student'
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        status: 'completed',
        actual_minutes: 24,
        total_credits_deducted: 4,
        remaining_balance: 74
      },
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Session finalized, hardware returned to idle pool' }]
  },
  {
    method: 'DELETE',
    path: '/api/student/sessions/{session_id}/queue',
    title: 'Cancel Pending Queued Compute Request',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Removes the student from the FIFO allocation queue before any physical workstation is locked, refunding any reserved credits.',
    whyItIsNeeded: 'Allows students to back out if their schedule changes without credit penalty.',
    responseSample: JSON.stringify(
      {
        status: 'cancelled',
        message: 'Queue request cancelled, no credits deducted'
      },
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Queue entry removed' }]
  },
  {
    method: 'GET',
    path: '/api/student/credits',
    title: 'Get Student Daily Allowance & Ledger Transactions',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Returns total daily allowance, current balance, reset timestamp (midnight local time), and itemized usage audit ledger.',
    whyItIsNeeded: 'Provides complete transparency into credit deductions and daily replenishments.',
    responseSample: JSON.stringify(
      {
        daily_allowance: 100,
        current_balance: 78,
        reserved_credits: 0,
        last_reset_date: '2026-10-17T00:00:00Z',
        transactions: [
          {
            id: 'tx_01',
            amount: -8,
            balance_after: 78,
            reason: 'Session sess_993f41bb (development)',
            created_at: '2026-10-17T09:30:00Z'
          }
        ]
      },
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Credit ledger returned' }]
  },
  {
    method: 'GET',
    path: '/api/student/files',
    title: 'List Student Persistent Workspace Files',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Lists files stored in the student persistent network share mounted into remote lab PC workspaces.',
    whyItIsNeeded: 'Ensures student scripts, models, and datasets persist across distinct physical lab workstations.',
    responseSample: JSON.stringify(
      [
        {
          id: 'file_01',
          filename: 'pytorch_experiment.py',
          size_bytes: 4820,
          storage_type: 'network_nfs',
          created_at: '2026-10-16T14:20:00Z'
        }
      ],
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Persistent file list' }]
  },
  {
    method: 'POST',
    path: '/api/student/files/upload',
    title: 'Upload Dataset or Script to Persistent Storage',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Uploads project files directly into the student private storage directory mounted during remote desktop sessions.',
    whyItIsNeeded: 'Allows students to prepare code and datasets from their personal laptops before starting a compute session.',
    parameters: 'multipart/form-data: file, storage_type (persistent | temporary)',
    responseSample: JSON.stringify(
      {
        id: 'file_02',
        filename: 'dataset_v2.csv',
        size_bytes: 1048576,
        storage_type: 'network_nfs',
        status: 'uploaded'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 201, text: 'File uploaded and synced successfully' },
      { code: 413, text: 'File exceeds 500MB quota threshold' }
    ]
  },
  {
    method: 'DELETE',
    path: '/api/student/files/{file_id}',
    title: 'Delete File from Persistent Storage',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Permanently removes a file from the student private workspace storage.',
    whyItIsNeeded: 'Allows students to free storage quota for newer experiments.',
    responseSample: JSON.stringify(
      {
        status: 'deleted',
        file_id: 'file_01'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'File deleted' },
      { code: 404, text: 'File not found' }
    ]
  },
  {
    method: 'GET',
    path: '/api/student/notifications',
    title: 'Fetch Compute Session Alerts & Quota Notifications',
    category: 'Student Compute & Workspaces',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'Returns notifications such as workstation allocated, 5-minute expiration warnings, and credit replenishment alerts.',
    whyItIsNeeded: 'Keeps students informed of session lifecycle events and prevents unexpected session timeouts.',
    responseSample: JSON.stringify(
      [
        {
          id: 'notif_01',
          title: 'Workstation Allocated',
          message: 'Your development workstation CS-LAB1-WS04 is ready.',
          notification_type: 'session_ready',
          is_read: false,
          created_at: '2026-10-17T09:30:01Z'
        }
      ],
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Notifications list' }]
  },

  // 4. Laboratory Supervision
  {
    method: 'GET',
    path: '/api/lab-assistant/labs',
    title: 'List Assigned Laboratories',
    category: 'Laboratory Supervision',
    roles: ['lab_assistant', 'technical_admin', 'institution_admin'],
    requiresAuth: true,
    whatItDoes: 'Returns physical laboratory rooms assigned to the staff technician with workstation totals, idle counts, and occupancy percentages.',
    whyItIsNeeded: 'Scuffs technician supervision strictly to physical lab rooms under their care.',
    responseSample: JSON.stringify(
      [
        {
          id: 'lab-cs-101',
          name: 'CS High Performance Lab 1',
          building: 'Turing Hall',
          room: 'Lab 101',
          total_computers: 25,
          online_computers: 24,
          active_sessions: 16
        }
      ],
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Assigned laboratories returned' }]
  },
  {
    method: 'GET',
    path: '/api/lab-assistant/computers',
    title: 'Live Hardware Inventory & Occupancy',
    category: 'Laboratory Supervision',
    roles: ['lab_assistant', 'technical_admin', 'institution_admin'],
    requiresAuth: true,
    whatItDoes: 'Provides real-time telemetry (CPU%, RAM%, GPU%), hardware status (idle, in_use, maintenance, offline), and active student assignments.',
    whyItIsNeeded: 'Allows technicians to monitor hardware health and detect overheating or runaway processes.',
    responseSample: JSON.stringify(
      [
        {
          id: 'node_lab1_pc04',
          safe_identifier: 'CS-LAB1-WS04',
          ip_address: '10.10.1.14',
          mac_address: '00:1A:2B:3C:4D:5E',
          status: 'in_use',
          cpu_model: 'Intel Core i9-13900K',
          ram_gb: 64,
          gpu_model: 'NVIDIA RTX 4080 (16GB)',
          current_cpu_percent: 24.5,
          current_ram_percent: 42.1,
          active_student_name: 'Aarav Sharma'
        }
      ],
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Hardware inventory returned' }]
  },
  {
    method: 'POST',
    path: '/api/lab-assistant/computers/{computer_id}/maintenance',
    title: 'Toggle Hardware Maintenance Mode',
    category: 'Laboratory Supervision',
    roles: ['lab_assistant', 'technical_admin', 'institution_admin'],
    requiresAuth: true,
    whatItDoes: 'Removes a physical computer from the scheduler allocation pool for driver servicing, hardware repairs, or in-person practical exams.',
    whyItIsNeeded: 'Prevents students from being allocated machines that are physically needed for on-campus laboratory sessions.',
    parameters: 'maintenance (boolean), reason (string)',
    requestSample: JSON.stringify(
      {
        maintenance: true,
        reason: 'Scheduled practical lab exam session'
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        computer_id: 'node_lab1_pc04',
        status: 'maintenance',
        updated_at: '2026-10-17T09:35:00Z'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'Maintenance mode toggled' },
      { code: 404, text: 'Computer ID not found in assigned lab' }
    ]
  },
  {
    method: 'POST',
    path: '/api/lab-assistant/sessions/{session_id}/stop',
    title: 'Staff Supervisory Override: Force Terminate Session',
    category: 'Laboratory Supervision',
    roles: ['lab_assistant', 'technical_admin', 'institution_admin'],
    requiresAuth: true,
    whatItDoes: 'Supervisory override allowing technicians to immediately terminate a session violating laboratory policies.',
    whyItIsNeeded: 'Ensures campus staff retain physical command over laboratory hardware in case of crypto-mining, misuse, or scheduled classes.',
    parameters: 'reason (string)',
    requestSample: JSON.stringify(
      {
        reason: 'Laboratory scheduled for physical exam'
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        session_id: 'sess_993f41bb',
        status: 'terminated_by_staff',
        timestamp: '2026-10-17T09:36:00Z'
      },
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Session forcefully terminated' }]
  },

  // 5. Department Governance
  {
    method: 'GET',
    path: '/api/hod/overview',
    title: 'Department Utilization & Metrics Overview',
    category: 'Department Governance',
    roles: ['hod', 'technical_admin', 'institution_admin'],
    requiresAuth: true,
    whatItDoes: 'Returns departmental metrics: enrolled students, pending verifications, computer utilization rates, and daily credits burned.',
    whyItIsNeeded: 'Provides Department Heads insight into student academic computing utilization.',
    responseSample: JSON.stringify(
      {
        department_name: 'Computer Science & Engineering',
        total_students: 420,
        active_students_today: 114,
        pending_approvals: 6,
        total_nodes: 50,
        utilization_percent: 68.0,
        credits_consumed_today: 1840
      },
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Department overview returned' }]
  },
  {
    method: 'GET',
    path: '/api/hod/students/pending',
    category: 'Department Governance',
    roles: ['hod', 'technical_admin', 'institution_admin'],
    requiresAuth: true,
    title: 'List Pending Student Registrations Awaiting Verification',
    whatItDoes: 'Returns students in the HOD department who registered and await roll-number verification.',
    whyItIsNeeded: 'Ensures only bona fide enrolled students in the department receive campus compute allowances.',
    responseSample: JSON.stringify(
      [
        {
          id: 'prof_829a1b',
          user_id: 'usr_98f4e2ab',
          full_name: 'Aarav Sharma',
          email: 'aarav.sharma@campus.edu',
          roll_number: '2023CS0142',
          academic_year: '3rd Year',
          registered_at: '2026-10-17T09:15:00Z'
        }
      ],
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Pending student list' }]
  },
  {
    method: 'POST',
    path: '/api/hod/students/{profile_id}/review',
    title: 'Approve or Reject Student Grid Access',
    category: 'Department Governance',
    roles: ['hod', 'technical_admin', 'institution_admin'],
    requiresAuth: true,
    whatItDoes: 'HOD verification of student registration. Approval unlocks daily 100-credit compute allocation.',
    whyItIsNeeded: 'Prevents unauthorized access while automating daily credit grants once approved.',
    parameters: 'action (approve | reject), reason (string)',
    requestSample: JSON.stringify(
      {
        action: 'approve',
        reason: 'Verified in CSE 3rd Year enrollment register'
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        profile_id: 'prof_829a1b',
        status: 'approved',
        daily_allowance_granted: 100,
        reviewed_at: '2026-10-17T09:40:00Z'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'Student access approved/rejected' },
      { code: 404, text: 'Student profile not found in your department' }
    ]
  },

  // 6. Institution Administration
  {
    method: 'GET',
    path: '/api/admin/overview',
    title: 'Campus-Wide Infrastructure Governance Overview',
    category: 'Institution Administration',
    roles: ['institution_admin', 'technical_admin'],
    requiresAuth: true,
    whatItDoes: 'Aggregates campus-wide metrics across all college departments, active laboratories, grid health, and total power/usage statistics.',
    whyItIsNeeded: 'Provides executive leadership (Dean, Director) with high-level campus resource efficiency metrics.',
    responseSample: JSON.stringify(
      {
        total_departments: 6,
        total_laboratories: 14,
        total_compute_nodes: 180,
        online_nodes: 168,
        active_streaming_sessions: 92,
        fleet_cpu_avg: 48.2,
        fleet_gpu_avg: 61.5,
        total_credits_minted_today: 18000
      },
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Institutional overview metrics' }]
  },
  {
    method: 'GET',
    path: '/api/admin/credit-policy',
    title: 'Get Campus Daily Credit Quotas & Workload Rates',
    category: 'Institution Administration',
    roles: ['institution_admin', 'technical_admin'],
    requiresAuth: true,
    whatItDoes: 'Retrieves current default daily allowance per student (e.g. 100 credits), reset timezone, and hourly burn rates per hardware profile.',
    whyItIsNeeded: 'Allows administrators to audit campus computing quotas.',
    responseSample: JSON.stringify(
      {
        daily_allowance: 100,
        timezone: 'Asia/Kolkata',
        rate_general: 5,
        rate_development: 8,
        rate_data_science: 12,
        rate_simulation: 18,
        rate_ml_gpu: 25
      },
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Credit policy configuration' }]
  },
  {
    method: 'PUT',
    path: '/api/admin/credit-policy',
    title: 'Update Campus Credit Quotas & Hourly Burn Rates',
    category: 'Institution Administration',
    roles: ['institution_admin'],
    requiresAuth: true,
    whatItDoes: 'Modifies institutional credit allowance and profile costs. Changes immediately propagate across all active schedulers.',
    whyItIsNeeded: 'Allows administrators to adjust campus quotas based on semester workload demands or exam periods.',
    parameters: 'daily_allowance (int), timezone (string), rate_general, rate_development, rate_data_science, rate_simulation, rate_ml_gpu',
    requestSample: JSON.stringify(
      {
        daily_allowance: 120,
        timezone: 'Asia/Kolkata',
        rate_general: 5,
        rate_development: 8,
        rate_data_science: 12,
        rate_simulation: 18,
        rate_ml_gpu: 30
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        status: 'updated',
        daily_allowance: 120,
        updated_at: '2026-10-17T09:45:00Z'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'Credit policy updated successfully' },
      { code: 403, text: 'Requires Institution Administrator authority' }
    ]
  },
  {
    method: 'POST',
    path: '/api/admin/computers',
    title: 'Provision New Physical Laboratory Computer into Grid',
    category: 'Institution Administration',
    roles: ['institution_admin', 'technical_admin'],
    requiresAuth: true,
    whatItDoes: 'Registers a physical laboratory workstation specifications, MAC address, IP address, and designated laboratory room.',
    whyItIsNeeded: 'Expands campus computing grid capacity by enrolling new physical computers into the allocation pool.',
    parameters: 'safe_identifier, lab_id, ip_address, mac_address, cpu_cores, ram_gb, gpu_model, os',
    requestSample: JSON.stringify(
      {
        safe_identifier: 'CS-LAB1-WS25',
        lab_id: 'lab-cs-101',
        ip_address: '10.10.1.35',
        mac_address: '00:1A:2B:3C:4D:99',
        cpu_cores: 16,
        ram_gb: 64,
        gpu_model: 'NVIDIA RTX 4090 (24GB)',
        os: 'Ubuntu 24.04 LTS'
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        id: 'node_lab1_pc25',
        safe_identifier: 'CS-LAB1-WS25',
        status: 'registered',
        created_at: '2026-10-17T09:50:00Z'
      },
      null,
      2
    ),
    statusCodes: [{ code: 201, text: 'Computer provisioned successfully' }]
  },
  {
    method: 'GET',
    path: '/api/admin/audit-logs',
    title: 'Inspect Tamper-Evident Security & Allocation Audit Trail',
    category: 'Institution Administration',
    roles: ['institution_admin'],
    requiresAuth: true,
    whatItDoes: 'Returns cryptographic chronological audit records for logins, node allocations, policy adjustments, and staff overrides.',
    whyItIsNeeded: 'Ensures institutional compliance, zero-trust integrity, and accountability across all campus users.',
    responseSample: JSON.stringify(
      [
        {
          id: 'aud_9182',
          actor_email: 'admin@campus.edu',
          action: 'UPDATE_POLICY',
          target: 'credit_policy:daily_allowance',
          ip_address: '10.0.0.1',
          details: 'Updated daily allowance to 120 credits',
          created_at: '2026-10-17T09:45:00Z'
        }
      ],
      null,
      2
    ),
    statusCodes: [{ code: 200, text: 'Audit trail records returned' }]
  },

  // 7. Worker Agent Daemon
  {
    method: 'POST',
    path: '/api/worker/heartbeat',
    title: 'Physical Laboratory PC Daemon Heartbeat & Telemetry',
    category: 'Worker Agent Daemon',
    roles: ['Worker Node Daemon'],
    requiresAuth: false,
    whatItDoes: 'Called every 5 seconds by the lightweight daemon running on physical lab computers to report CPU, RAM, GPU load, and active session status.',
    whyItIsNeeded: 'Enables the central scheduler to detect hardware failures, ungraceful reboots, and automatically update telemetry in real time.',
    parameters: 'safe_identifier, cpu_percent, ram_percent, gpu_percent, active_session_id, agent_version',
    requestSample: JSON.stringify(
      {
        safe_identifier: 'CS-LAB1-WS04',
        cpu_percent: 28.4,
        ram_percent: 41.2,
        gpu_percent: 64.0,
        active_session_id: 'sess_993f41bb',
        agent_version: '1.0.0'
      },
      null,
      2
    ),
    responseSample: JSON.stringify(
      {
        status: 'acknowledged',
        command: 'maintain_session',
        session_id: 'sess_993f41bb'
      },
      null,
      2
    ),
    statusCodes: [
      { code: 200, text: 'Heartbeat recorded, telemetry updated' },
      { code: 404, text: 'Unrecognized computer identifier' }
    ]
  },

  // 8. Real-Time WebSockets
  {
    method: 'WS',
    path: '/ws/telemetry',
    title: 'Cluster Telemetry & Queue Updates Broadcast',
    category: 'Real-Time WebSockets',
    roles: ['Public / Authenticated'],
    requiresAuth: false,
    whatItDoes: 'Bidirectional WebSocket stream pushing cluster node availability, queue length updates, and scheduler allocation changes to connected browser clients.',
    whyItIsNeeded: 'Keeps student and staff dashboards live without polling overhead.',
    responseSample: JSON.stringify(
      {
        type: 'METRIC_UPDATE',
        active_nodes: 34,
        total_nodes: 50,
        queue_length: 2,
        timestamp: '2026-10-17T09:55:00Z'
      },
      null,
      2
    ),
    statusCodes: [{ code: 101, text: 'Switching Protocols to WebSocket' }]
  },
  {
    method: 'WS',
    path: '/ws/stream/{session_id}',
    title: 'In-Browser Low-Latency Remote Desktop Frame & Input Tunnel',
    category: 'Real-Time WebSockets',
    roles: ['student'],
    requiresAuth: true,
    whatItDoes: 'High-speed binary transport tunnel delivering compressed 60 FPS remote desktop visual frames to the canvas and relaying student mouse/keyboard events back to the lab PC.',
    whyItIsNeeded: 'Provides the actual core remote computing experience inside standard browsers without plugins or downloads.',
    requestSample:
      '// Binary or JSON Client Input Packet:\n' +
      JSON.stringify(
        {
          type: 'mouse_move',
          x: 1024,
          y: 768,
          button: 0
        },
        null,
        2
      ),
    responseSample: '// Compressed Video Frame Packets (H.264 / WebRTC / Guacamole Protocol)\n[Raw Video Byte Stream]',
    statusCodes: [
      { code: 101, text: 'Switching Protocols to WebSocket Stream Tunnel' },
      { code: 403, text: 'Unauthorized session stream request' }
    ]
  }
]

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    '/api/health': true,
    '/api/auth/login': true,
    '/api/student/requests': true
  })
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Live health status probe
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [isProbing, setIsProbing] = useState(false)

  const probeBackendHealth = async () => {
    setIsProbing(true)
    try {
      const res = await fetch(`${API_BASE}/health`)
      if (res.ok) {
        setIsOnline(true)
      } else {
        setIsOnline(false)
      }
    } catch {
      setIsOnline(false)
    } finally {
      setIsProbing(false)
    }
  }

  useEffect(() => {
    probeBackendHealth()
  }, [])

  const categories = [
    'All',
    'System Health Probe',
    'Authentication & Accounts',
    'Student Compute & Workspaces',
    'Laboratory Supervision',
    'Department Governance',
    'Institution Administration',
    'Worker Agent Daemon',
    'Real-Time WebSockets'
  ]

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => {
      setCopiedKey(null)
    }, 2000)
  }

  const toggleEndpoint = (path: string) => {
    setExpandedEndpoints((prev) => ({
      ...prev,
      [path]: !prev[path]
    }))
  }

  const filteredEndpoints = useMemo(() => {
    return ENDPOINT_CATALOG.filter((ep) => {
      const matchesCategory = selectedCategory === 'All' || ep.category === selectedCategory
      const q = searchQuery.trim().toLowerCase()
      if (!q) return matchesCategory

      const matchesSearch =
        ep.path.toLowerCase().includes(q) ||
        ep.title.toLowerCase().includes(q) ||
        ep.whatItDoes.toLowerCase().includes(q) ||
        ep.whyItIsNeeded.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' }
      case 'POST':
        return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' }
      case 'PUT':
        return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' }
      case 'DELETE':
        return { color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' }
      case 'WS':
        return { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' }
      default:
        return { color: '#FAFAFA', bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.2)' }
    }
  }

  return (
    <div
      className="api-docs-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '12px 0 60px'
      }}
    >
      {/* 1. TOP HEADER & INTERACTIVE EXPLORER LAUNCHER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          {onBack && (
            <button
              className="glass-btn"
              onClick={onBack}
              style={{ minHeight: '34px', padding: '0 12px', fontSize: '0.8rem', marginBottom: '14px', gap: '6px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Workspace</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <Code size={20} color="#38BDF8" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FAFAFA', letterSpacing: '-0.02em', margin: 0 }}>
              API Documentation
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '99px', background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? '#10B981' : isOnline === false ? '#F59E0B' : '#71717A' }} />
              <span style={{ color: isOnline ? '#10B981' : isOnline === false ? '#F59E0B' : '#A1A1AA' }}>
                {isOnline ? 'Grid Controller Online' : isOnline === false ? 'Offline Mode (Static Catalog)' : 'Checking Probe...'}
              </span>
            </div>
          </div>

          <p style={{ color: '#A1A1AA', fontSize: '0.92rem', maxWidth: '740px', lineHeight: 1.6, margin: 0 }}>
            The IdleNode Controller Grid API coordinates secure browser-to-laboratory computing. It provides zero-trust access control, atomic scheduler hardware allocation, daily student credit tracking, and low-latency WebRTC/WebSocket streaming tunnels without exposing private campus laboratory IP addresses.
          </p>
        </div>

        {/* Clean Interactive Explorer Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href={SWAGGER_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-btn primary"
            style={{ textDecoration: 'none', minHeight: '42px', padding: '0 20px', gap: '8px', fontSize: '0.88rem' }}
            title="Open Interactive Swagger UI in a new tab"
          >
            <BookOpen size={16} />
            <span>Open Interactive API Explorer</span>
            <ExternalLink size={14} />
          </a>

          <button
            onClick={probeBackendHealth}
            disabled={isProbing}
            className="glass-btn"
            style={{ minHeight: '42px', padding: '0 12px' }}
            title="Refresh controller connectivity status"
          >
            <RefreshCw size={14} className={isProbing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. ARCHITECTURE OVERVIEW & ZERO-TRUST FLOW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Why IdleNode Needs an API */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} color="#38BDF8" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
              Zero-Trust Architecture & Ingress Protection
            </h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#A1A1AA', lineHeight: 1.6, margin: 0 }}>
            Physical campus laboratory computers reside on protected internal subnets. The API acts as an intelligent proxy so students never need direct network access:
          </p>
          <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: '#D4D4D8', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '4px', margin: 0 }}>
            <li><strong>Port Isolation:</strong> RDP (3389) and SSH (22) remain locked behind campus firewalls.</li>
            <li><strong>Atomic Allocation:</strong> Prevents dual-occupancy using transactional scheduler database locks.</li>
            <li><strong>Fair Quotas:</strong> Enforces daily student allowances and graceful 15-minute reconnect grace periods.</li>
          </ul>
        </div>

        {/* Authentication Flow */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={18} color="#10B981" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
              Authentication & Authorization Flow
            </h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#A1A1AA', lineHeight: 1.6, margin: 0 }}>
            Protected endpoints require an OAuth2 JSON Web Token passed in the standard authorization header:
          </p>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: '#38BDF8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Authorization: Bearer &lt;access_token&gt;</span>
            <button
              onClick={() => handleCopy('Authorization: Bearer <access_token>', 'auth_header')}
              style={{ background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer', padding: '2px' }}
              title="Copy header format"
            >
              {copiedKey === 'auth_header' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#A1A1AA', lineHeight: 1.5, margin: 0 }}>
            Tokens are issued upon calling <code style={{ color: '#E4E4E7' }}>POST /api/auth/login</code> and contain verified role claims (<code style={{ color: '#E4E4E7' }}>student</code>, <code style={{ color: '#E4E4E7' }}>lab_assistant</code>, <code style={{ color: '#E4E4E7' }}>hod</code>, <code style={{ color: '#E4E4E7' }}>institution_admin</code>).
          </p>
        </div>
      </div>

      {/* 3. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color="#F59E0B" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
            Role-Based Access Control (RBAC) Matrix
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: '#A1A1AA', margin: 0 }}>
          Strict operational separation guarantees that students consume compute without supervisory access, while staff supervise without consuming compute quotas.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#A1A1AA' }}>
                <th style={{ padding: '10px 14px' }}>Platform Role</th>
                <th style={{ padding: '10px 14px' }}>Compute Workspaces</th>
                <th style={{ padding: '10px 14px' }}>Hardware Telemetry</th>
                <th style={{ padding: '10px 14px' }}>Student Approvals</th>
                <th style={{ padding: '10px 14px' }}>Credit Policies</th>
                <th style={{ padding: '10px 14px' }}>Node Registry</th>
                <th style={{ padding: '10px 14px' }}>Audit Trail</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#38BDF8' }}>Student</td>
                <td style={{ padding: '12px 14px', color: '#10B981', fontWeight: 600 }}>YES (Full Remote)</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>Own Sessions Only</td>
                <td style={{ padding: '12px 14px', color: '#71717A' }}>No</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>View Own Balance</td>
                <td style={{ padding: '12px 14px', color: '#71717A' }}>No</td>
                <td style={{ padding: '12px 14px', color: '#71717A' }}>No</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#10B981' }}>Lab Assistant</td>
                <td style={{ padding: '12px 14px', color: '#F43F5E', fontWeight: 500 }}>No (Supervisor)</td>
                <td style={{ padding: '12px 14px', color: '#10B981' }}>Assigned Labs Only</td>
                <td style={{ padding: '12px 14px', color: '#71717A' }}>No</td>
                <td style={{ padding: '12px 14px', color: '#71717A' }}>No</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>Maintenance Mode</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>Recent Lab Events</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#F59E0B' }}>Head of Dept (HOD)</td>
                <td style={{ padding: '12px 14px', color: '#F43F5E', fontWeight: 500 }}>No (Governor)</td>
                <td style={{ padding: '12px 14px', color: '#10B981' }}>Department Labs</td>
                <td style={{ padding: '12px 14px', color: '#10B981', fontWeight: 600 }}>YES (Approve / Reject)</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>View Dept Total</td>
                <td style={{ padding: '12px 14px', color: '#71717A' }}>No</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>Department Logs</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#FAFAFA' }}>Institution Admin</td>
                <td style={{ padding: '12px 14px', color: '#F43F5E', fontWeight: 500 }}>No (Administrator)</td>
                <td style={{ padding: '12px 14px', color: '#10B981' }}>All Campus Nodes</td>
                <td style={{ padding: '12px 14px', color: '#10B981' }}>High-Level</td>
                <td style={{ padding: '12px 14px', color: '#10B981', fontWeight: 600 }}>YES (Configure Quotas)</td>
                <td style={{ padding: '12px 14px', color: '#10B981', fontWeight: 600 }}>YES (Register Nodes)</td>
                <td style={{ padding: '12px 14px', color: '#10B981', fontWeight: 600 }}>Full Immutable Trail</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#A855F7' }}>Worker Daemon</td>
                <td style={{ padding: '12px 14px', color: '#A855F7' }}>Daemon Stream Host</td>
                <td style={{ padding: '12px 14px', color: '#10B981' }}>Reports Heartbeat</td>
                <td style={{ padding: '12px 14px', color: '#71717A' }}>No</td>
                <td style={{ padding: '12px 14px', color: '#71717A' }}>No</td>
                <td style={{ padding: '12px 14px', color: '#10B981' }}>Auto Sync IP/MAC</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>Heartbeat Ack</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 5-STEP BEGINNER-FRIENDLY GETTING STARTED GUIDE */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal size={18} color="#38BDF8" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
            5-Step Quick Getting Started Guide
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Step 1 */}
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FAFAFA' }}>
                <span style={{ color: '#38BDF8', marginRight: '8px' }}>Step 1:</span> Probe Cluster Controller Health
              </div>
              <button
                onClick={() => handleCopy('curl -X GET http://127.0.0.1:8000/api/health', 'step1')}
                className="glass-btn"
                style={{ minHeight: '26px', padding: '0 8px', fontSize: '0.72rem', gap: '4px' }}
              >
                {copiedKey === 'step1' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                <span>Copy curl</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#D4D4D8', overflowX: 'auto' }}>
              <code>curl -X GET http://127.0.0.1:8000/api/health</code>
            </pre>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FAFAFA' }}>
                <span style={{ color: '#38BDF8', marginRight: '8px' }}>Step 2:</span> Authenticate with Demo Credentials
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    'curl -X POST http://127.0.0.1:8000/api/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d \'{"email":"student@campus.edu","password":"password123"}\'',
                    'step2'
                  )
                }
                className="glass-btn"
                style={{ minHeight: '26px', padding: '0 8px', fontSize: '0.72rem', gap: '4px' }}
              >
                {copiedKey === 'step2' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                <span>Copy curl</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#D4D4D8', overflowX: 'auto' }}>
              <code>{`curl -X POST http://127.0.0.1:8000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"student@campus.edu","password":"password123"}'`}</code>
            </pre>
          </div>

          {/* Step 3 */}
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FAFAFA', marginBottom: '4px' }}>
              <span style={{ color: '#38BDF8', marginRight: '8px' }}>Step 3:</span> Authorize in Swagger Explorer
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#A1A1AA', lineHeight: 1.5 }}>
              Open the interactive Swagger UI via the <strong>Open Interactive API Explorer</strong> button above. Click <strong>Authorize 🔓</strong>, enter the copied token as <code style={{ color: '#E4E4E7' }}>Bearer &lt;token&gt;</code>, and click <strong>Authorize</strong> to test protected routes.
            </p>
          </div>

          {/* Step 4 */}
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FAFAFA' }}>
                <span style={{ color: '#38BDF8', marginRight: '8px' }}>Step 4:</span> Request Laboratory Compute Hardware (Student Role)
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    'curl -X POST http://127.0.0.1:8000/api/student/requests \\\n  -H "Authorization: Bearer <YOUR_TOKEN>" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"workload_profile":"development","requested_duration_minutes":60,"min_cpu_cores":8,"min_ram_gb":32,"require_gpu":false}\'',
                    'step4'
                  )
                }
                className="glass-btn"
                style={{ minHeight: '26px', padding: '0 8px', fontSize: '0.72rem', gap: '4px' }}
              >
                {copiedKey === 'step4' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                <span>Copy curl</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#D4D4D8', overflowX: 'auto' }}>
              <code>{`curl -X POST http://127.0.0.1:8000/api/student/requests \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"workload_profile":"development","requested_duration_minutes":60,"min_cpu_cores":8,"min_ram_gb":32,"require_gpu":false}'`}</code>
            </pre>
          </div>

          {/* Step 5 */}
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FAFAFA', marginBottom: '4px' }}>
              <span style={{ color: '#38BDF8', marginRight: '8px' }}>Step 5:</span> Connect to Low-Latency Streaming Gateway
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#A1A1AA', lineHeight: 1.5 }}>
              Use <code style={{ color: '#E4E4E7' }}>POST /api/student/sessions/&#123;id&#125;/connect</code> to initialize the gateway tunnel, then connect your HTML5 canvas to <code style={{ color: '#38BDF8' }}>ws://.../ws/stream/&#123;session_id&#125;</code> for 60 FPS remote desktop rendering and mouse/keyboard binary pass-through.
            </p>
          </div>
        </div>
      </div>

      {/* 5. SEARCHABLE ENDPOINT DIRECTORY WITH CATEGORY FILTERS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FAFAFA', margin: 0 }}>
              Endpoint Directory ({filteredEndpoints.length})
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#A1A1AA', marginTop: '2px' }}>
              Inspect parameters, role restrictions, and real JSON response schemas.
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }} />
            <input
              type="text"
              placeholder="Filter endpoints, methods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input"
              style={{ width: '100%', paddingLeft: '34px', height: '36px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className="glass-btn"
              onClick={() => setSelectedCategory(cat)}
              style={{
                minHeight: '30px',
                padding: '0 12px',
                fontSize: '0.78rem',
                background: selectedCategory === cat ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                borderColor: selectedCategory === cat ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                color: selectedCategory === cat ? '#38BDF8' : '#A1A1AA'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Expandable Endpoint Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredEndpoints.map((ep) => {
            const isExpanded = !!expandedEndpoints[ep.path]
            const badge = getMethodBadge(ep.method)

            return (
              <div
                key={`${ep.method}-${ep.path}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: isExpanded ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'border-color 0.2s ease, background 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Header row */}
                <div
                  onClick={() => toggleEndpoint(ep.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        minWidth: '54px',
                        textAlign: 'center'
                      }}
                    >
                      {ep.method}
                    </span>

                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#FAFAFA', fontWeight: 600 }}>
                      {ep.path}
                    </code>

                    <span style={{ fontSize: '0.82rem', color: '#A1A1AA' }}>
                      — {ep.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {ep.roles.map((r) => (
                        <span
                          key={r}
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            borderRadius: '99px',
                            background:
                              r === 'student'
                                ? 'rgba(56, 189, 248, 0.1)'
                                : r.includes('admin')
                                ? 'rgba(244, 63, 94, 0.1)'
                                : 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: r === 'student' ? '#38BDF8' : '#D4D4D8',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    <div style={{ color: '#71717A' }}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '16px 20px 20px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      background: 'rgba(0, 0, 0, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    {/* What it does & Why it is needed */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#38BDF8', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                          What It Does
                        </span>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#D4D4D8', lineHeight: 1.5 }}>
                          {ep.whatItDoes}
                        </p>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#10B981', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                          Why It Is Needed
                        </span>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#D4D4D8', lineHeight: 1.5 }}>
                          {ep.whyItIsNeeded}
                        </p>
                      </div>
                    </div>

                    {/* Parameters & Permissions */}
                    {(ep.parameters || ep.restrictions) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
                        {ep.parameters && (
                          <div>
                            <span style={{ color: '#A1A1AA', fontFamily: 'var(--font-mono)' }}>Parameters: </span>
                            <code style={{ color: '#FAFAFA' }}>{ep.parameters}</code>
                          </div>
                        )}
                        {ep.restrictions && (
                          <div style={{ color: '#F59E0B' }}>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>Access Restriction: </span>
                            <span>{ep.restrictions}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Request Sample if present */}
                    {ep.requestSample && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#A1A1AA', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                            Example Request
                          </span>
                          <button
                            onClick={() => handleCopy(ep.requestSample!, `req-${ep.path}`)}
                            style={{ background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
                          >
                            {copiedKey === `req-${ep.path}` ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                            <span>{copiedKey === `req-${ep.path}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre style={{ margin: 0, padding: '12px', background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#E4E4E7' }}>
                          <code>{ep.requestSample}</code>
                        </pre>
                      </div>
                    )}

                    {/* Response Sample */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#10B981', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                          Example Response Schema (HTTP 200/201)
                        </span>
                        <button
                          onClick={() => handleCopy(ep.responseSample, `res-${ep.path}`)}
                          style={{ background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
                        >
                          {copiedKey === `res-${ep.path}` ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                          <span>{copiedKey === `res-${ep.path}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre style={{ margin: 0, padding: '12px', background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#38BDF8' }}>
                        <code>{ep.responseSample}</code>
                      </pre>
                    </div>

                    {/* Status Codes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#A1A1AA', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                        Common Status Codes & Errors
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {ep.statusCodes.map((sc) => {
                          const isOk = sc.code < 400
                          return (
                            <div
                              key={sc.code}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: isOk ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                                border: `1px solid ${isOk ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                                fontSize: '0.74rem'
                              }}
                            >
                              <strong style={{ color: isOk ? '#10B981' : '#F43F5E', fontFamily: 'var(--font-mono)' }}>
                                {sc.code}
                              </strong>
                              <span style={{ color: '#D4D4D8' }}>{sc.text}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 6. STANDARD HTTP ERROR CODES EXPLANATION */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} color="#FAFAFA" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
            Standard HTTP Status Codes & Error Handling
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: '#A1A1AA', margin: 0 }}>
          All error responses conform to the standard RFC 7807 problem details format: <code style={{ color: '#E4E4E7' }}>&#123;&quot;detail&quot;: &quot;Descriptive error message&quot;&#125;</code>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {[
            { code: 200, title: '200 OK', desc: 'Request succeeded. Target resource returned.' },
            { code: 201, title: '201 Created', desc: 'Resource created (e.g. computer allocation or user profile).' },
            { code: 400, title: '400 Bad Request', desc: 'Malformed request or business rule violated (e.g. insufficient daily credit balance).' },
            { code: 401, title: '401 Unauthorized', desc: 'Authentication failed. Missing, expired, or malformed JWT Bearer token.' },
            { code: 403, title: '403 Forbidden', desc: 'Caller role lacks permission for the endpoint (e.g. student accessing lab supervisor tools).' },
            { code: 404, title: '404 Not Found', desc: 'Resource does not exist (e.g. invalid session ID or computer node ID).' },
            { code: 409, title: '409 Conflict', desc: 'Concurrency lock contention (e.g. computer already allocated to another session).' },
            { code: 422, title: '422 Validation Error', desc: 'Pydantic request body schema validation failed. Returns field-level locations.' },
            { code: 500, title: '500 Server Error', desc: 'Unexpected backend exception. Logged to server console.' }
          ].map((item) => (
            <div
              key={item.code}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: item.code < 400 ? '#10B981' : item.code < 500 ? '#F59E0B' : '#F43F5E' }}>
                  {item.title}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#A1A1AA', lineHeight: 1.4 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
