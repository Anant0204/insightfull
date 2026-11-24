# Comprehensive QA & Verification Test Plan

**Project**: Employee Monitoring System (EMS) & Workforce Intelligence Platform  
**Audit Date**: 2026-11-23  
**QA Director & Security Engineer**: Antigravity  

---

## 1. Test Strategy Overview

This test plan defines the testing strategy, test suites, execution commands, and acceptance criteria across all three operational tiers (Desktop Agent, Backend API, and Frontend Web Application).

### Test Pillars
1. **Pillar 1: Identity, RBAC & Multi-Tenant Isolation**: Enforce zero-leakage between organizations and verify strict role restrictions (`ADMIN`, `MANAGER`, `EMPLOYEE`).
2. **Pillar 2: Real-Time Telemetry & Alerting Engine**: Test high-frequency heartbeats, smart idle thresholds, prohibited app detection, and WebSocket event broadcasts.
3. **Pillar 3: Data Integrity & Business Logic**: Validate cycle time analytics, dynamic payroll calculations, shift adherence, and stale session auto clock-outs.
4. **Pillar 4: Windows Desktop Agent & Packaging**: Verify executable generation, NSIS installer execution, signature validation, clean installation/uninstallation, and antivirus compatibility.
5. **Pillar 5: Frontend End-to-End User Journeys**: Verify navigation across all 14 main menus, 6 sub-reports, modals, filters, and exports.

---

## 2. Test Suites & Execution Matrix

### Test Suite 1: Backend Security, RBAC & Multi-Tenant Isolation
- **Target File**: `backend/scripts/test_dev4_integration.js`
- **Execution Command**: `node backend/scripts/test_dev4_integration.js`
- **Scope & Assertions**:
  1. `assert(res14m === null)`: Clock-in at 14 minutes late does NOT trigger late arrival alert (<15m threshold).
  2. `assert(res15m !== null)`: Clock-in at 15 minutes late triggers `LATE_ARRIVAL` alert with `AlertLog` creation.
  3. `assert(resDupLate === null)`: Duplicate late arrival alert on the same calendar day is suppressed.
  4. `assert(resNoShift === null)`: Clock-in for an employee without an active shift does NOT generate late alert.
  5. `assert(resIdle29m === null)`: Continuous idle at 29m (1740s) does NOT trigger idle alert (<30m threshold).
  6. `assert(resIdle30m !== null)`: Continuous idle at 30m (1800s) triggers `CONTINUOUS_IDLE` alert.
  7. `assert(resIdle31m === null)`: Same continuous idle session continuation is deduplicated.
  8. `assert(resIdleRestart === null)`: Server restart / DB check prevents duplicate idle alerts.
  9. `assert(resAppProductive === null)`: Productive app access (VS Code) does NOT trigger alert.
  10. `assert(resAppProhibited !== null)`: Explicitly prohibited app (`isBlocked: true`) triggers critical alert with screenshot.
  11. `assert(empCanSeeViolation === false)`: Employees CANNOT view manager-level security violations.
  12. `assert(canOrgASeeOrgB === false)`: Organization A CANNOT view or dismiss Organization B alert records.
  13. `assert(isEmployeeAllowedInMgrRoom === false)`: Employees are forbidden from joining manager WebSocket rooms.

---

### Test Suite 2: Business Logic, Tasks & Workflow Cycle Time
- **Target File**: `backend/scripts/verify_all.js`
- **Execution Command**: `node backend/scripts/verify_all.js`
- **Scope & Assertions**:
  1. **Department-Specific Productivity Rules**: Verifies global rule vs team override (e.g. LinkedIn marked Productive for Marketing, Unproductive for Engineering).
  2. **Universal Data Export Engine**: Validates UTF-8 CSV generation and binary Excel (.xlsx) workbook creation.
  3. **Workflow Cycle Time & Bottleneck Detection**: Validates average cycle time and stage duration calculation from `task_status_history`.
  4. **Jira & ClickUp Connectors**: Verifies task schema normalization, missing config rejection, and HMAC SHA-256 webhook signature verification.
  5. **Webhook Deduplication**: Re-submitting the same webhook event ID does not process duplicate tasks.

---

### Test Suite 3: Desktop Agent Telemetry & Windows Compatibility
- **Target Files**: `agent/main.js`, `agent/scripts/get-active-window.ps1`
- **Scope & Assertions**:
  1. **Foreground Window Capture**: Verify `fetchActiveWindow()` returns `{ appName, title, pid }` for current active window.
  2. **Smart Idle State Machine**:
     - At 60s inactivity: State transitions to `PASSIVE`.
     - At 300s inactivity: State transitions to `IDLE_WARNING`; triggers warning reminder.
     - At 600s inactivity: State transitions to `IDLE`; sends `IDLE` state transition to server.
     - At user input: State transitions to `RESUMED`; presents resume prompt.
  3. **Violation Trigger**: Active window containing blacklisted keyword (`youtube`, `netflix`) immediately triggers instant screen capture.
  4. **Auto-Project Mapping**: Window title matching `[ProjectName]` or IDE process maps to corresponding project ID.
  5. **Offline Queue Resilience**: If server is unreachable, telemetry records append to local JSON queue; flushes on reconnection.

---

### Test Suite 4: Windows Installer, SmartScreen & Uninstaller Verification
- **Target Files**: `agent/package.json`, NSIS output package
- **Build Command**: `cd agent && npm run build:win`
- **Scope & Assertions**:
  1. **Installer Artifact Generation**: Produces NSIS executable `EMS-Tracker-latest.exe`.
  2. **File Hash Calculation**: Computes SHA-256 checksum and records in release register.
  3. **Authenticode Signature Verification**:
     - Command: `Get-AuthenticodeSignature "dist/EMS-Tracker-latest.exe"`
     - Must report `Valid` status when signed with organization or test certificate.
  4. **Silent & Interactive Install Smoke Test**:
     - Command: `EMS-Tracker-latest.exe /S`
     - Verify executable copied to `%LOCALAPPDATA%\Programs\Insightful Agent\`.
     - Verify desktop and start menu shortcuts created.
  5. **Clean Uninstallation**:
     - Command: `Uninstall "Insightful Agent.exe" /S`
     - Verify `%LOCALAPPDATA%\Programs\Insightful Agent` removed.
     - Verify `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\insightful-agent` deleted.
     - Verify `%APPDATA%\insightful-agent` configuration directory cleaned.
  6. **SmartScreen & Antivirus Diagnostic**:
     - Submit file hash to VirusTotal or check with Windows Defender CLI: `MpCmdRun.exe -Scan -ScanType 3 -File "<path>"`.
     - Verify zero malicious detections and clarify publisher reputation requirements.

---

### Test Suite 5: Frontend Build & Routing Smoke Test
- **Target Directory**: `frontend/`
- **Execution Command**: `cd frontend && npm run build`
- **Scope & Assertions**:
  1. **Vite Production Bundling**: Compiles all JSX, TypeScript, CSS, and assets into `frontend/dist/` without syntax or import errors.
  2. **Navigation Completeness**: All 14 main menus and 6 sub-reports render their layout containers without `404 Not Found` or white screens.
  3. **Role Route Guarding**: Unauthenticated users visiting `/admin` or `/employee` are immediately redirected to `/login`.
  4. **Compliance Navigation**: Clicking "Compliance" in Sidebar opens SOC 2 & ISO 27001 readiness view and audit logs.

---

## 3. Pass / Fail Acceptance Criteria

| Checkpoint | Pass Criteria | Action on Failure |
| :--- | :--- | :--- |
| **Backend Integration Suite** | 100% of assertion tests exit with code 0. | Halt deployment; debug controller/service logic. |
| **Frontend Production Build** | Vite build completes with 0 errors. | Resolve missing imports, syntax errors, or unused vars. |
| **Installer Executable** | Executable builds cleanly and passes Authenticode check. | Verify electron-builder signing configuration. |
| **Uninstallation** | 0 leftover registry keys or orphan processes. | Update NSIS uninstallation macro. |
| **Data Isolation** | 0 cross-tenant data visible in any API response. | Add missing `organizationId` filter in query. |
| **Security Telemetry** | Prohibited app access generates instant screenshot & alert log. | Debug blacklist keyword matcher and cooldown timer. |
