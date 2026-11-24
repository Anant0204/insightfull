# Feature Inventory & Functional Audit

**Project**: Employee Monitoring System (EMS) & Workforce Intelligence Platform  
**Audit Date**: 2026-11-23  
**Auditor**: Lead Software Architect & Multi-Agent Coordinator  

---

## 1. Feature Status Classification Legend

- **WORKING**: Fully implemented in UI, connected to real REST/WebSocket API, backed by Prisma models, and verified functional.
- **PARTIAL**: Implemented in part; either UI lacks full form validation/states, API has unhandled edge cases, or features rely partially on simulation stores.
- **BROKEN**: Exists in code but fails at runtime due to import errors, missing paths, syntax issues, or backend exceptions.
- **PLACEHOLDER**: UI component renders mock/static data or dummy controls without backend/DB persistence.
- **MISSING**: Documented in PRD or requirements but entirely absent from frontend or backend implementation.
- **NOT VERIFIED**: Code exists but requires live desktop execution, active Windows session, or external credential setup to verify.

---

## 2. Core Functional Capabilities Matrix

### 2.1 Identity, Authentication & Onboarding
| Feature | Intended Scope | UI Component | Backend API | Database Model | Status | Notes & Gaps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin & Manager Login** | Secure JWT authentication with email & password | `pages/Login.jsx` | `POST /api/auth/login` | `User`, `Employee` | **WORKING** | Supports admin & manager role-based redirect upon login. |
| **Employee Invitation** | Admin invites new employee with role & team | `pages/EmployeeManagement.jsx` | `POST /api/employees/invite` | `InvitationToken`, `Employee` | **WORKING** | Generates secure cryptographic invite token and email link. |
| **Employee Password Setup** | Invited employee sets password via token link | `pages/SetupPassword.jsx` | `POST /api/auth/invitations/setup-password` | `User`, `InvitationToken` | **WORKING** | Validates token expiry, creates user account, hashes password via bcrypt. |
| **Agent Setup & Download** | Download desktop client with prefilled token | `pages/SetupAgent.jsx` | `GET /api/auth/invitations/validate/:token`, `GET /api/agent/download` | `InvitationToken` | **PARTIAL** | Page renders and validates invite, but executable binary served is unsigned. |
| **Hardware Device Enrollment** | Desktop client registers unique HWID on first boot | `agent/main.js`, `agent/index.html` | `POST /api/agent/register` | `Agent` | **WORKING** | Generates base64 hardware hash from OS hostname, platform, arch, and CPU model. |
| **Agent Approval Flow** | Admin reviews and activates/deactivates agent | `pages/AgentManagement.jsx` | `PATCH /api/agent/:id/status` | `Agent` | **WORKING** | Socket event `agent:approved` unlocks desktop agent tracking immediately. |

---

### 2.2 Time, Attendance & Scheduling
| Feature | Intended Scope | UI Component | Backend API | Database Model | Status | Notes & Gaps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Clock-In / Clock-Out** | Automatic session start via agent & web fallback | `components/header/HeaderTaskTimer.jsx`, `pages/TimeAndAttendance.jsx` | `POST /api/attendance/clock-in`, `POST /api/attendance/clock-out` | `Attendance` | **WORKING** | Tracks start time, end time, duration, and status. |
| **Shift Management** | Schedule shifts with start/end time per employee | `pages/settings/alerts/ShiftScheduling.jsx` | `GET /api/attendance/shifts`, `POST /api/attendance/shifts` | `Shift` | **WORKING** | Backed by `shifts` table in MySQL. |
| **Late Arrival Detection** | Alert when clock-in exceeds shift schedule + tolerance | Background Alert Engine | `alerts.service.js:evaluateLateArrival` | `AlertLog`, `Notification` | **WORKING** | 15-minute default tolerance with calendar-day deduplication. |
| **Stale Session Sweeper** | Auto clock-out employees silent >10 minutes | `server.js` interval | `attendanceSession.js:processAllStaleSessions` | `Attendance`, `Employee` | **WORKING** | Prevents zombie sessions when agent machine crashes or sleeps. |
| **Manual Time Submissions** | Employee requests manual time with reason | `pages/settings/ManualTime.jsx` | `POST /api/attendance/manual-time` | `ManualTime` | **WORKING** | Stores start, end, duration, timezone, and note for manager review. |
| **Timesheets & Approvals** | Weekly timesheets with manager approval workflow | `pages/Payroll.jsx`, `timesheets.service.js` | `GET/POST /api/timesheets`, `POST /api/timesheets/:id/approve` | `Timesheet`, `TimesheetApproval` | **WORKING** | Calculates regular and overtime minutes, total pay, and status history. |
| **Time Off Requests** | Single/multi-day leave requests | `pages/TimeAndAttendance.jsx` | `POST /api/attendance/time-off` | `TimeOff` | **WORKING** | Stores start/end date, type (sick, vacation, personal). |

---

### 2.3 Activity, Application & Productivity Telemetry
| Feature | Intended Scope | UI Component | Backend API | Database Model | Status | Notes & Gaps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Foreground Window Detection** | Capture active app name, window title, PID | `agent/main.js`, `scripts/get-active-window.ps1` | Ingested via `POST /api/agent/activity` | `ActivityLog`, `AppUsageLog` | **WORKING** | Uses native Win32 `GetForegroundWindow` & `GetWindowText`. |
| **Productivity Categorization** | Productive / Neutral / Unproductive categorization | `pages/settings/ProductivityApps.jsx` | `GET/POST /api/productivity/rules` | `ProductivityRule`, `ProductivityTag` | **WORKING** | Supports global rules and department/team-level overrides. |
| **Smart Inactivity / Idle States** | Detect keyboard/mouse inactivity with reminders | `agent/main.js`, `agent/preload.js` | `POST /api/agent/idle` | `IdleSession`, `Employee` | **WORKING** | 3-tier state machine (1m passive, 5m warning, 10m idle). |
| **Prohibited App Access Alert** | Detect blacklisted apps and trigger alert | `agent/main.js:handleViolationScreenshot` | `alerts.service.js:evaluateProhibitedApp` | `AlertLog`, `Notification` | **WORKING** | Triggers critical alert with attached screenshot upon violation. |
| **Activity Timeline** | Visual interactive timeline of employee day | `pages/ActivitiesTimeline.jsx` | `GET /api/activity/timeline` | `ActivityLog` | **WORKING** | Interactive block visualization across active, idle, manual, and break. |
| **App & Website Usage Reports** | Aggregated usage time, percentage, and trends | `pages/reports/AppsWebsites.jsx` | `GET /api/reports/apps-websites` | `AppUsageLog` | **WORKING** | Supports category filtering, date presets, and CSV export. |

---

### 2.4 Screenshot & Video Capture
| Feature | Intended Scope | UI Component | Backend API | Database Model | Status | Notes & Gaps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Periodic Screen Capture** | Capture desktop screenshot every N minutes | `agent/main.js:captureScreenBase64` | `POST /api/agent/activity` | `Screenshot` | **WORKING** | Default 3m (configurable 1-15m). Compresses to 65% quality JPEG. |
| **Violation-Triggered Capture** | Instant screen capture upon visiting blacklisted app | `agent/main.js:handleViolationScreenshot` | `POST /api/agent/activity` | `Screenshot`, `AlertLog` | **WORKING** | Debounced with 60s cooldown to prevent flood. |
| **Live Stream Capture Mode** | High-frequency capture (every 3s) on admin request | `agent/main.js:socket.on('live:request')` | WebSocket event `live:request` | In-memory / temporary | **WORKING** | Auto-stops after 5 minutes to conserve network & storage. |
| **Global Screenshot Blur** | Blur sensitive areas or entire screen for privacy | `pages/ScreenshotMonitoring.jsx` | `PUT /api/screenshots/settings` | `ScreenshotSetting`, `ComplianceSetting` | **WORKING** | Canvas/CSS blur with configurable blur levels (1-5). |
| **Automated Storage Cleanup** | Prune screenshots older than retention policy | `modules/screenshots/cleanup.service.js` | Nightly background cron | `Screenshot` | **WORKING** | Removes image files from disk (`public/uploads`) and deletes DB records. |
| **Screen Video Recording** | Optional recorded video clips | `pages/ScreenshotMonitoring.jsx` | `GET /api/videos` | `VideoRecording` | **PARTIAL** | DB model and route exist; agent recording pipeline needs local ffmpeg verification. |

---

### 2.5 Projects, Tasks & Auto-Mapping
| Feature | Intended Scope | UI Component | Backend API | Database Model | Status | Notes & Gaps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Management** | Create projects, assign teams, set hourly rates | `pages/Projects.jsx` | `GET/POST /api/projects` | `Project`, `ProjectAssignment` | **WORKING** | Full CRUD with budget, billable rate, and assignments. |
| **Kanban Task Board** | Drag-and-drop tasks across statuses | `pages/TasksProjects.jsx` | `GET/POST /api/tasks`, `PATCH /api/tasks/:id/status` | `Task`, `task_status_history` | **WORKING** | Backlog -> In Operations -> Quality Assurance -> Finalized. |
| **Task Time Logging** | Link employee work hours to specific tasks | `components/header/HeaderTaskTimer.jsx` | `POST /api/tasks/:id/time-log` | `TaskTimeLog`, `ProjectTimeLog` | **WORKING** | Timer syncs active task ID to desktop agent via IPC. |
| **Auto Project Mapping** | Detect project from IDE window title via regex | `agent/main.js:matchAutoProject` | `GET /api/agent/projects` | `time_mapping_rules`, `Project` | **WORKING** | Matches VS Code / IDE window titles against project patterns. |
| **Cycle Time & Bottleneck Mining** | Analyze stage duration and identify bottlenecks | `pages/reports/ProcessMining.jsx` | `GET /api/process-mining/cycle-time` | `task_status_history` | **WORKING** | Computes average cycle time in days/hours and primary bottleneck stage. |

---

### 2.6 Payroll, Billing & Invoicing
| Feature | Intended Scope | UI Component | Backend API | Database Model | Status | Notes & Gaps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dynamic Payroll Calculation** | Calculate employee earnings based on active hours | `pages/Payroll.jsx` | `GET /api/payroll` | `PayrollRecord`, `Employee` | **WORKING** | `Total Hours * Hourly Rate` dynamically aggregated from activity logs. |
| **Invoicing & Status** | Generate and track customer invoices | `pages/Payroll.jsx` | `GET/POST /api/payroll/invoices` | `Invoice` | **WORKING** | Tracks draft, sent, paid, overdue states. |
| **Subscription & Plans** | Billing tier selection and add-on management | `pages/settings/billing/Plans.jsx`, `AddOns.jsx` | Simulated / Store | `billingStore.js` | **PARTIAL** | UI cards functional; payment gateway integration (Stripe) is mock/demo. |

---

### 2.7 Real-Time Telemetry & Alerting
| Feature | Intended Scope | UI Component | Backend API | Database Model | Status | Notes & Gaps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Live Employee Status** | Online / Idle / Offline indicators | `pages/RealTimeInsights.jsx` | WebSocket `employee_status` | In-memory cache + `Employee` | **WORKING** | Evaluates activity recency (<1m online, <5m idle, >5m offline). |
| **Live Activity Feed** | Real-time stream of current applications in use | `pages/RealTimeInsights.jsx` | WebSocket `activity_update` | `LiveActivity` | **WORKING** | Broadcasts live app and window title to manager room. |
| **Notification Center** | In-app notification bell with unread badge | `layouts/Header.jsx` | `GET/PATCH /api/notifications` | `Notification` | **WORKING** | Supports mark read, mark all read, delete, and role filtering. |
| **Alert Rules Configuration** | Define custom alert triggers and thresholds | `pages/Alerts.jsx`, `pages/settings/alerts/` | `GET/POST /api/alerts/rules` | `AlertRule`, `AlertSettings` | **WORKING** | Supports late clock-in, early clock-out, idle threshold, and headcount alerts. |
| **Automated PDF Reports** | Scheduled executive intelligence PDF emails | `modules/email-reports/` | `POST /api/email-reports` | `EmailReport`, `AuditLog` | **WORKING** | Generates formatted PDF attachment via PDFKit and sends via SMTP. |

---

### 2.8 Compliance, Privacy & Audit
| Feature | Intended Scope | UI Component | Backend API | Database Model | Status | Notes & Gaps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SOC 2 & ISO 27001 Readiness** | Security framework control audit checklist | `pages/compliance/ComplianceReadiness.jsx` | `GET /api/compliance-readiness/overview` | `ComplianceSetting` | **WORKING** | Dynamic readiness score calculation across security domains. |
| **System Audit Logs** | Immutable administrative action event logs | `pages/settings/AuditLogs.jsx`, `pages/Compliance.jsx` | `GET /api/compliance/audit-logs` | `AuditLog` | **WORKING** | Records actor, action, timestamp, metadata, IP address. |
| **GDPR & Privacy Controls** | Configurable retention, blur, and URL visibility | `pages/settings/Privacy.jsx` | `PUT /api/compliance/settings` | `ComplianceSetting` | **WORKING** | Configures retention period, activity monitoring toggles, blur levels. |
| **Location & Fleet Tracking** | GPS coordinates tracking for field workforce | `pages/LocationTracking.jsx` | `GET /api/location/employees` | `LocationLog`, `WorkZone` | **WORKING** | Interactive Leaflet map with moving/idle pins and geofence work zones. |
| **Third-Party Integrations** | Connectors for Jira, ClickUp, Slack | `pages/settings/integrations/` | `GET/POST /api/integrations` | `Integration` | **PARTIAL** | Normalization & HMAC webhook validation verified; live external API keys required. |

---

## 3. High-Priority Functional Gaps

1. **Sidebar Navigation Missing Compliance Link**:
   - `Sidebar.jsx` line 42 has `Compliance` commented out. The full SOC 2 & ISO 27001 Readiness and Audit Log page (`/compliance`) is inaccessible from the primary navigation.
2. **Desktop Client Installation & Packaging**:
   - Executable is unsigned, causing Windows Defender SmartScreen blocks.
   - Hardcoded paths in `agent/prebuild.js` and `agent/copy-latest-exe.js` break build scripts.
   - Module imports in `agent/main.js` include brittle relative fallbacks.
3. **Database Environment Isolation**:
   - `backend/.env` points to live production Railway MySQL. Needs local test database profile to prevent production data corruption.
