# Defect & Bug Register

**Project**: Employee Monitoring System (EMS) & Workforce Intelligence Platform  
**Audit Date**: 2026-11-23  
**Auditor**: Lead Software Architect & Multi-Agent Coordinator  

---

## 1. Bug Summary Overview

| Bug ID | Severity | Component | Summary | Proposed Fix |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | **P0** | Agent/Packaging | Desktop executable is unsigned (`NotSigned`), causing Windows Defender SmartScreen blocks. | Configure electron-builder signing pipeline, publisher metadata, and code-signing readiness guide. |
| **BUG-002** | **P0** | Agent/Build | Hardcoded misspelled directory names in `prebuild.js` and `copy-latest-exe.js` break build. | Update relative paths to resolve `backend` and `frontend` dynamically. |
| **BUG-003** | **P0** | Agent/Runtime | Brittle relative require paths in `agent/main.js` point to non-existent directories. | Remove invalid fallback require paths and bundle dependencies properly via package.json. |
| **BUG-004** | **P0** | Agent/Runtime | Default API URL fallback in `main.js` points to remote Railway production backend. | Use local environment configuration / `server-config.json` with fallback to `http://localhost:5000`. |
| **BUG-005** | **P0** | Security/DevOps | Hardcoded production Railway MySQL credentials in `backend/.env` risk data corruption. | Parameterize local test database profile (SQLite / local MySQL) and isolate production secrets. |
| **BUG-006** | **P1** | Frontend/Nav | Compliance link commented out in `Sidebar.jsx`, hiding SOC 2 / ISO 27001 readiness page. | Uncomment Compliance navItem with appropriate role access guard in `Sidebar.jsx`. |
| **BUG-007** | **P1** | Agent/Security | Spawning PowerShell process for screen capture triggers AV behavioral heuristics. | Use native Node.js desktop capture pipeline or compiled C# helper rather than dynamic PowerShell invocation. |
| **BUG-008** | **P1** | Frontend/Config | `VITE_API_URL` defaults to remote Railway URL in `frontend/.env`. | Update `frontend/.env` to point to `http://localhost:5000/api` for local development. |
| **BUG-009** | **P1** | Desktop/Installer | NSIS uninstaller does not clean up Run registry keys and AppData folders. | Add custom NSIS uninstall hooks to remove startup Run key and clean AppData cache. |
| **BUG-010** | **P2** | Backend/QA | Missing `test` script in `backend/package.json` to execute integration test suites. | Add `"test"` script running `test_dev4_integration.js` and `verify_all.js`. |
| **BUG-011** | **P2** | Frontend/Clean | Unused leftover file `frontend/src/pages/temp.jsx`. | Safely remove unreferenced dead code. |
| **BUG-012** | **P2** | Frontend/Billing | Billing plans and add-on subscriptions rely on mock state without payment gateway. | Add clear UI indicator for simulation mode or provide backend subscription endpoint. |
| **BUG-013** | **P2** | Agent/Build | `copy-latest-exe.js` invokes powershell without `-ExecutionPolicy Bypass`. | Add `-ExecutionPolicy Bypass -NoProfile` to powershell commands. |

---

## 2. Detailed Bug Descriptions & Remediation Plans

### BUG-001 (Severity: P0) — Desktop Executable Unsigned & SmartScreen Block
- **Component**: Windows Desktop Agent / Packaging (`agent/package.json`, `backend/public/agent/EMS-Tracker-latest.exe`)
- **Root Cause**: The current distributed executable `EMS-Tracker-latest.exe` has Authenticode status `NotSigned` (SHA-256: `E3C9C7F0B18134A72DDA050ACECF8E2E5D50E9ED7CA94F5D001551A1E3BC7D96`). When downloaded via browser on Windows 10/11, Windows Defender SmartScreen halts execution with "Windows protected your PC — Unknown Publisher".
- **Reproduction Steps**:
  1. Download `EMS-Tracker-latest.exe` from `/api/agent/download`.
  2. Launch installer on a Windows machine with standard Defender SmartScreen enabled.
  3. Observe SmartScreen blue warning modal blocking installation.
- **Expected Behavior**: Installer has valid Authenticode signature with publisher identity, valid timestamp, and clean SmartScreen reputation.
- **Affected Files**: `agent/package.json`, `agent/prebuild.js`, `agent/copy-latest-exe.js`.
- **Proposed Fix**:
  1. Update `agent/package.json` with comprehensive `win` and `nsis` configurations, including `signAndEditExecutable`, `certificateFile` / `certificatePassword` environment hooks, RFC 3161 timestamping (`http://timestamp.digicert.com`).
  2. Provide automated local self-signed certificate generation script for development/testing (`scripts/generate-dev-cert.ps1`) and instructions for importing to `Cert:\CurrentUser\Root` for local testing.
  3. Detail organizational EV/OV code-signing certificate release pipeline.
- **Regression Risk**: Low; does not alter internal monitoring logic.
- **Rollback Method**: Revert `agent/package.json` to previous commit.

---

### BUG-002 (Severity: P0) — Hardcoded Misspelled Paths in Build Scripts
- **Component**: Desktop Agent Build Scripts (`agent/prebuild.js`, `agent/copy-latest-exe.js`)
- **Root Cause**: Scripts contain hardcoded paths:
  - `agent/prebuild.js:19`: `path.resolve(__dirname, '..', 'employee-monitoirng-backend', '.env')` (note typo: `monitoirng`).
  - `agent/copy-latest-exe.js:28-29`: `'employee-monitoirng-backend'` and `'employee-monitoring-frontend'`.
  In the actual repository structure, folders are `backend` and `frontend`. Running `npm run build` or `npm run publish-latest` crashes with path errors.
- **Reproduction Steps**:
  1. `cd agent`
  2. `node prebuild.js`
  3. Observe `Backend .env file not found, using default` warning and failures during publish.
- **Expected Behavior**: Scripts resolve `../backend` and `../frontend` dynamically regardless of root folder naming.
- **Affected Files**: `agent/prebuild.js`, `agent/copy-latest-exe.js`.
- **Proposed Fix**: Change directory resolution to inspect both `../backend` and `../frontend` with fallback to parent directory lookup.
- **Regression Risk**: None.
- **Rollback Method**: `git checkout agent/prebuild.js agent/copy-latest-exe.js`.

---

### BUG-003 (Severity: P0) — Brittle Relative Require Paths in `main.js`
- **Component**: Desktop Agent Runtime (`agent/main.js`)
- **Root Cause**: `main.js` contains fallback require blocks:
  - Line 70: `require('../employee-monitoring/employee-monitoring-frontend/node_modules/axios')`
  - Line 80: `require('../employee-monitoring/employee-monitoring-frontend/node_modules/socket.io-client')`
  - Line 500: `require('../employee-monitoring/employee-monitoring-frontend/node_modules/screenshot-desktop')`
  On packaged client machines, this non-existent path will fail and can cause runtime crashes if dependencies are not resolved from `agent/node_modules`.
- **Reproduction Steps**:
  1. Run `agent` outside of an environment with `employee-monitoring-frontend` in parallel.
  2. If local `agent/node_modules` is absent, the app crashes instead of giving a clean diagnostic error.
- **Expected Behavior**: `agent/package.json` contains all required runtime dependencies (`axios`, `socket.io-client`, `screenshot-desktop`, `dotenv`, `electron-log`), and `main.js` imports them directly via standard `require('axios')`.
- **Affected Files**: `agent/main.js`.
- **Proposed Fix**: Remove brittle relative path fallbacks; ensure standard imports with descriptive error logging if missing.
- **Regression Risk**: Low.
- **Rollback Method**: `git checkout agent/main.js`.

---

### BUG-004 (Severity: P0) — Default Server URL Points to Remote Production
- **Component**: Desktop Agent Configuration (`agent/main.js`, `agent/server-config.json`, `agent/prebuild.js`)
- **Root Cause**: In `agent/main.js:106`, `resolveServerUrl()` falls back to `https://insight-pool-production.up.railway.app/api`. Similarly, `prebuild.js` defaults to the same URL. This causes any local desktop agent build to silently send employee telemetry to a live Railway production database.
- **Reproduction Steps**:
  1. Build or launch agent without `API_URL` environment variable.
  2. Inspect console logs: `[Desktop Agent] Initialized with API_URL: https://insight-pool-production.up.railway.app`.
- **Expected Behavior**: Local development defaults to `http://localhost:5000` or reads explicitly from local `server-config.json`.
- **Affected Files**: `agent/main.js`, `agent/prebuild.js`, `agent/server-config.json`.
- **Proposed Fix**: Update default fallback to `http://localhost:5000` for development and ensure `server-config.json` injection respects local backend `.env`.
- **Regression Risk**: Low.
- **Rollback Method**: `git checkout agent/main.js agent/prebuild.js agent/server-config.json`.

---

### BUG-005 (Severity: P0) — Hardcoded Live Railway DB Credentials in `.env`
- **Component**: Backend Configuration / Security (`backend/.env`, `backend/.env.example`)
- **Root Cause**: `backend/.env` has:
  `DATABASE_URL="mysql://root:xgdDKchBGVfJNAUZKhHRFTKxRuIACKVM@turntable.proxy.rlwy.net:51664/railway"`
  This violates Global Rules 3 and 5 (no production live DB changes, local test DB only). Any script like `clearAttendance.js` or `verify_all.js` will execute against Railway.
- **Reproduction Steps**:
  1. Inspect `backend/.env` line 3.
  2. Notice live MySQL credentials.
- **Expected Behavior**: Production credentials should not be hardcoded in committed repository files; local development should default to local MySQL (`localhost:3306`) or an isolated test database.
- **Affected Files**: `backend/.env`, `backend/.env.example`.
- **Proposed Fix**: Configure `DATABASE_URL` in `.env.example` to point to local MySQL (`mysql://root:@localhost:3306/employee_monitoring_test`), document credentials separation, and provide local test mock/adapter.
- **Regression Risk**: Medium (must ensure local test database is accessible or mock DB configured before running tests).
- **Rollback Method**: `git checkout backend/.env.example`.

---

### BUG-006 (Severity: P1) — Compliance Navigation Item Commented Out in Sidebar
- **Component**: Frontend Navigation (`frontend/src/layouts/Sidebar.jsx`)
- **Root Cause**: Line 42 in `Sidebar.jsx`:
  `// { name: 'Compliance', icon: ShieldCheck, path: '/compliance', key: 'compliance' },`
  is commented out. The page `frontend/src/pages/Compliance.jsx` (which contains SOC 2 & ISO 27001 readiness checks and audit logs) is completely hidden from the user navigation.
- **Reproduction Steps**:
  1. Log into web app as Admin.
  2. Inspect sidebar navigation items.
  3. "Compliance" is absent.
- **Expected Behavior**: Admins can access the Compliance & Readiness module via the sidebar navigation.
- **Affected Files**: `frontend/src/layouts/Sidebar.jsx`.
- **Proposed Fix**: Uncomment the navItem in `Sidebar.jsx` and ensure `hasAccess('compliance')` allows Admin access.
- **Regression Risk**: Minimal (pure UI navigation enablement).
- **Rollback Method**: Re-comment line 42 in `Sidebar.jsx`.

---

### BUG-007 (Severity: P1) — Dynamic PowerShell Screen Capture Triggers Antivirus Heuristics
- **Component**: Windows Desktop Agent (`agent/main.js:captureScreenBase64`)
- **Root Cause**: `agent/main.js` executes `powershell -NoProfile -NonInteractive -Command ...` using `System.Drawing.Graphics.CopyFromScreen` every 3 seconds (in live stream mode) or 3 minutes (in periodic mode). Antivirus endpoint protection (including Windows Defender AMSI) flags rapid, repeated spawning of hidden PowerShell processes capturing the screen as spyware/screen-scraping heuristic activity.
- **Reproduction Steps**:
  1. Run `agent` under high-frequency live monitoring.
  2. Task Manager shows dozens of short-lived `powershell.exe` process spawns.
  3. Windows Defender or third-party AV logs suspicious process behavior.
- **Expected Behavior**: Screen capture should use the native Electron `desktopCapturer` API or a single persistent compiled C# helper assembly, avoiding repeated child process spawning.
- **Affected Files**: `agent/main.js`.
- **Proposed Fix**: Utilize Electron's native `desktopCapturer` API in the main process with fallback to persistent compiled C# helper, eliminating rapid child PowerShell process creation.
- **Regression Risk**: Medium; requires testing screen capture accuracy on Windows 10/11.
- **Rollback Method**: Revert `agent/main.js` capture function.

---

### BUG-008 (Severity: P1) — `frontend/.env` Defaults to Live Railway Backend
- **Component**: Frontend Configuration (`frontend/.env`)
- **Root Cause**: `frontend/.env:2` specifies `VITE_API_URL=https://insight-pool-production.up.railway.app/api`. When running `npm run dev`, API requests go to the remote server rather than local `localhost:5000`.
- **Reproduction Steps**:
  1. Inspect `frontend/.env`.
  2. Notice line 1 (`# VITE_API_URL=http://localhost:5000/api`) is commented out.
- **Expected Behavior**: Development environment points to local backend (`http://localhost:5000/api`).
- **Affected Files**: `frontend/.env`.
- **Proposed Fix**: Uncomment line 1 and set local URL as default.
- **Regression Risk**: Low.
- **Rollback Method**: `git checkout frontend/.env`.

---

### BUG-009 (Severity: P1) — Desktop Uninstaller Leaves Registry Run Keys & AppData Cache
- **Component**: Desktop Installer (`agent/package.json:build.nsis`)
- **Root Cause**: As documented in `DOC/agentpcdeletesetup.md`, uninstalling the agent does not remove the autostart registry entry at `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\insightful-agent` and leaves `%APPDATA%\insightful-agent` intact.
- **Reproduction Steps**:
  1. Install desktop agent with autostart enabled.
  2. Uninstall via Windows Settings -> Installed Apps -> Uninstall.
  3. Check `regedit` under `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`. The `insightful-agent` entry remains.
- **Expected Behavior**: Clean uninstallation removes registry startup hooks, desktop shortcuts, and prompts to clean local configuration cache.
- **Affected Files**: `agent/package.json`.
- **Proposed Fix**: Add NSIS `delete` statements in uninstaller macro for startup registry key and cache.
- **Regression Risk**: Low.
- **Rollback Method**: `git checkout agent/package.json`.

---

### BUG-010 (Severity: P2) — Missing Automated Test Scripts in `backend/package.json`
- **Component**: Backend QA Pipeline (`backend/package.json`)
- **Root Cause**: `backend/package.json` has only `start`, `dev`, `build`, `prisma:generate`, and `prisma:migrate`. Despite having integration suites (`scripts/test_dev4_integration.js`, `scripts/verify_all.js`), there is no `npm test` script.
- **Reproduction Steps**:
  1. `cd backend && npm test`
  2. Fails with `npm ERR! Missing script: "test"`.
- **Expected Behavior**: `npm test` executes the verification and integration suites cleanly.
- **Affected Files**: `backend/package.json`.
- **Proposed Fix**: Add `"test": "node scripts/test_dev4_integration.js"` and `"test:all": "node scripts/verify_all.js"`.
- **Regression Risk**: None.
- **Rollback Method**: `git checkout backend/package.json`.
