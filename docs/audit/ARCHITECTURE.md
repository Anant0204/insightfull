# System Architecture Audit Report

**Project**: Employee Monitoring System (EMS) & Workforce Intelligence Platform  
**Audit Date**: 2026-11-23  
**Auditor**: Lead Software Architect & Multi-Agent Coordinator  
**Confirmed Working Directory**: `D:\kiaan\employee monitoring`  
**Git Branch**: `audit-and-fix` (Checkpoint: `main` at `0470665`)

---

## 1. Executive Architecture Summary

The Employee Monitoring System is an enterprise-grade, multi-tier software suite providing automated workforce telemetry, desktop monitoring, project and task time tracking, productivity analytics, attendance logging, compliance enforcement, and automated reporting.

The system is organized into three primary operational tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WINDOWS DESKTOP TIER                            │
│  [Insightful Agent - Electron 29 / Windows GDI+ / PowerShell / Socket] │
└───────────────────────┬──────────────────────────▲─────────────────────┘
                        │ HTTPS (REST) / WSS       │ Real-time Events
                        ▼                          │
┌────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICE TIER                           │
│  [Node.js 22 + Express 5 + Socket.IO 4 + Prisma ORM 5 + Node-Cron]     │
│   - Modules: Auth, Employees, Teams, Tracking, Screenshots, Payroll    │
│   - Telemetry Ingestion, Stale Session Sweeper, PDF Report Dispatcher  │
└───────────────────────┬──────────────────────────┬─────────────────────┘
                        │ SQL Connection Pool      │
                        ▼                          ▼
┌──────────────────────────────────┐   ┌─────────────────────────────────┐
│         DATABASE STORAGE         │   │         FILE / BLOB STORE       │
│  [MySQL Database via Prisma ORM] │   │  [Local /uploads/ & Cloudinary] │
│   - 32 Models / 8 Enums          │   │   - Screenshots & WebM Videos   │
│   - Tenant & Role Isolation      │   └─────────────────────────────────┘
└──────────────────────────────────┘
                        ▲
                        │ REST APIs / Socket.IO
┌───────────────────────┴────────────────────────────────────────────────┐
│                         FRONTEND WEB TIER                              │
│  [React 18 + Vite 5 + Tailwind CSS + Zustand Stores + Recharts]        │
│   - RBAC Dashboards: Admin Executive, Manager Team, Employee Personal  │
│   - 14 Top-Level Menus, 6 Sub-Reports, Settings Suite, Realtime Feeds  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Component Inventory

| Subsystem | Path | Tech Stack | Entry Point | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop Agent** | `agent/` | Electron 29, Axios, Socket.IO Client, GDI+, PowerShell Win32 | `agent/main.js` | Background employee telemetry, screen capture, window title detection, smart idle monitoring |
| **Backend API** | `backend/` | Node.js 22, Express 5, Prisma 5, Socket.IO 4, Multer, Sharp, PDFKit | `backend/src/server.js` | REST & WebSocket ingestion, business logic, tenant isolation, DB transactions, background schedulers |
| **Frontend Web** | `frontend/` | React 18, Vite 5, Tailwind CSS 3, Zustand 5, Recharts, Leaflet | `frontend/src/main.jsx` | Web application for Admin, Manager, and Employee dashboards, setup flows, analytics, reports |
| **Audit Docs** | `docs/audit/` | Markdown | - | Systematic baseline audits, bug registries, menu matrices, dependency & test plans |

---

## 3. Desktop Agent Architecture (`agent/`)

### 3.1 Technology Stack & Lifecycle
- **Runtime**: Electron v29.3.1 (Node v20.9.0 bundled with Chromium).
- **Packaging**: `electron-builder` v24.6.3 generating NSIS (`.exe`) installer and portable executable.
- **Process Model**:
  - **Main Process (`main.js`)**: Orchestrates OS interaction, window creation, system tray, power monitor listeners, capture timers, and network synchronizations.
  - **Preload Script (`preload.js`)**: Secure `contextBridge` exposing `electronAPI`, `agentAPI`, and backward-compatible `electron` namespaces with strict IPC isolation.
  - **Renderer (`index.html`)**: Lightweight status UI for device enrollment, invite validation, employee registration, and permission checks.

### 3.2 Telemetry Ingestion Mechanisms
1. **Active Window & Application Detection**:
   - Executes `scripts/get-active-window.ps1` or inline C# Win32 compiled code (`GetForegroundWindow`, `GetWindowText`, `GetWindowThreadProcessId`).
   - Cross-platform fallbacks exist for macOS (`screencapture` + AppleScript) and Linux (`xdotool`, `xprintidle`).
2. **Screen Capture Engine**:
   - Primary: Native Windows GDI+ capture via PowerShell using `System.Windows.Forms` and `System.Drawing` to capture primary screen bounds into a compressed JPEG stream (quality: 65%) encoded to Base64.
   - Secondary: `screenshot-desktop` npm package as fallback.
3. **Smart Inactivity & Idle Monitoring**:
   - Uses Electron `powerMonitor.getSystemIdleTime()` to measure elapsed seconds since last keyboard or mouse input.
   - State Machine:
     - `ACTIVE`: < 60s inactivity.
     - `PASSIVE`: >= 60s inactivity.
     - `IDLE_WARNING`: >= 300s (5 min) inactivity; triggers local notification/reminder prompt.
     - `IDLE`: >= 600s (10 min) inactivity; logs `IDLE` state transition to server and pauses productive time accumulation.
     - `RESUMED`: Input detected; presents prompt to log idle time as break or project task.
4. **Violation Detection & Instant Trigger**:
   - Evaluates active window title and process name against blacklisted domains/keywords (`youtube`, `netflix`, `tiktok`, `facebook`, etc.).
   - On match, immediately captures instant screenshot and uploads an alert payload with `violation: true`. Includes a 60-second debounce cooldown (`VIOLATION_COOLDOWN_MS`) to prevent spam.
5. **Auto Project Mapping**:
   - Evaluates active window titles against cached organization project names and IDE regex patterns (`Visual Studio Code`, `WebStorm`, `Cursor`, `Project: [name]`).
   - Syncs active project ID to server heartbeat and logs.

---

## 4. Backend Service Architecture (`backend/`)

### 4.1 Framework & Core Modules
- **Framework**: Express v5.2.1 running on Node.js 22.
- **ORM & Data Layer**: Prisma ORM v5.16.2 targeting MySQL.
- **Database Schema**: 32 relational models and 8 enums handling full SaaS entities:
  - Identity & Access: `User`, `Organization`, `Employee`, `Team`, `InvitationToken`, `AuditLog`.
  - Monitoring: `ActivityLog`, `AppUsageLog`, `Screenshot`, `Tracking`, `VideoRecording`, `LiveActivity`, `IdleSession`.
  - Operations & Time: `Attendance`, `Shift`, `TimeOff`, `ManualTime`, `Timesheet`, `TimesheetApproval`, `Project`, `ProjectAssignment`, `ProjectTimeLog`, `Task`, `TaskTimeLog`, `task_status_history`, `time_mapping_rules`.
  - Configuration & Rules: `TrackingSetting`, `AdvancedTrackingSetting`, `ScreenshotSetting`, `ProductivityRule`, `ProductivityTag`, `AlertRule`, `AlertSettings`, `EmailReport`, `ComplianceSetting`, `Integration`, `Goal`, `GoalStakeholder`, `GoalActivity`, `Location`, `LocationLog`, `WorkZone`, `Invoice`, `PayrollRecord`, `Notification`.

### 4.2 API Structure (186 Endpoints Across 29 Modules)
- All routes mounted under `/api` in `src/routes/index.js`.
- Key Ingestion Endpoints:
  - `POST /api/agent/register`: Registers hardware deviceId and binds to invited employee.
  - `POST /api/agent/heartbeat`: Receives lightweight presence pulses, task IDs, and auto-mapped project IDs.
  - `POST /api/agent/activity`: Ingests window titles, durations, productivity classifications, and screenshots.
  - `POST /api/agent/idle`: Ingests smart idle state changes and employee prompt responses.
  - `GET /api/agent/download`: Serves latest Windows desktop agent executable.
- Real-Time Monitoring & WebSockets (`src/socket/server.js`):
  - Socket.IO server authenticates connections via JWT handshake.
  - Rooms partitioned by organization (`org_${orgId}`), managerial roles (`org_${orgId}_managers`), and individual employees (`employee_${employeeId}`).
  - Emits: `activity_update`, `employee_status`, `screenshot_ready`, `live:request`, `agent:approved`.

### 4.3 Background Jobs & Schedulers
1. **Stale Session Sweeper**:
   - Runs every 60 seconds (`setInterval` in `server.js`).
   - Checks employees with active attendance where `lastActiveAt` > 10 minutes ago, automatically closing attendance sessions to prevent inflated work hours.
2. **Automated Screenshot Storage Cleanup**:
   - `modules/screenshots/cleanup.service.js` runs cron jobs to delete screenshots older than the organization's retention policy (default: 30 days) from disk and database.
3. **Automated PDF Email Report Dispatcher**:
   - `modules/email-reports/reportScheduler.js` generates automated daily/weekly workforce intelligence PDF summaries via PDFKit and dispatches them via Nodemailer.

---

## 5. Frontend Architecture (`frontend/`)

### 5.1 Architecture & Component Hierarchy
- **Framework**: React 18.2.0 SPA initialized via Vite 5.0.10.
- **Routing**: `react-router-dom` v6.21.0 with dynamic role prefixing (`/:rolePath/*` where `rolePath` is `admin`, `manager`, or `employee`).
- **State Management**:
  - Centralized Zustand stores (`frontend/src/store/`) managing auth, employees, teams, tasks, attendance, live metrics, filters, and settings.
  - `RealTimeContext.jsx`: Persistent WebSocket listener streaming live telemetry into reactive UI components.
- **UI Design System**:
  - Tailored enterprise design system utilizing Tailwind CSS, Lucide React icons, and Recharts visualization.
  - Dark/Light mode toggle powered by `useTheme.js`.

### 5.2 Role-Based Access Control (RBAC)
- Routes and sidebar modules are guarded by `ProtectedRoute`, `RoleRoute`, and `useAuthStore.getState().hasAccess(key)`:
  - **ADMIN**: Unrestricted access to executive dashboards, agent management, organization settings, user management, billing, compliance readiness, payroll, alert rules, and audit logs.
  - **MANAGER**: Team-scoped dashboards, employee activity monitoring, attendance logs, screenshot reviews, task assignments, and department productivity rules. Restricted from billing, organization settings, and global payroll.
  - **EMPLOYEE**: Restricted personal dashboard (`/employee`), personal activity timeline, task board, manual time submissions, and self-work session indicators. Restricted from viewing peer screenshots, organizational settings, or company-wide payroll.

---

## 6. Security, Compliance, and Data Isolation Posture

1. **Multi-Tenant Isolation**:
   - Every database query in backend controllers enforces `where: { organizationId }` derived securely from the authenticated JWT session (`req.user.organizationId`).
   - Cross-tenant data leakage is prevented at the ORM layer.
2. **Authentication Token Lifecycle**:
   - Web application: Standard Bearer JWT stored in `localStorage` with automated 401 interception in `apiClient.js`.
   - Desktop Agent: Persistent Base64 token (`X-Agent-Auth`) verified against `Agent` table in database.
3. **Employee Privacy Controls**:
   - Global screenshot blur option in `ScreenshotSetting` and `ComplianceSetting`.
   - Prohibits recording passwords, private messengers, and personal data.
   - Transparent tray indicator notifying employees when tracking is active.
4. **Current Security Deficiencies Identified**:
   - Desktop executable is **unsigned** (Status: `NotSigned`), causing Windows SmartScreen blocks.
   - Hardcoded production Railway database credentials located in `backend/.env`.
   - Relative hardcoded paths in `agent/prebuild.js` and `agent/copy-latest-exe.js` referencing non-existent parent directory names.
