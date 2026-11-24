# Pending Tasks & Backlog Register

**Project**: Employee Monitoring System (EMS) & Workforce Intelligence Platform  
**Audit Date**: 2026-11-23  
**Auditor**: Lead Software Architect & Multi-Agent Coordinator  

---

## 1. Backlog Prioritization Schema

- **P0 (Critical Blockers)**: Security exposure, crashes, installer failures, SmartScreen blocks, build errors, data corruption hazards.
- **P1 (Core Telemetry & Workflows)**: Agent data collection, attendance sync, dashboard reporting, navigation enablement, RBAC consistency.
- **P2 (Incomplete Menus & Polish)**: CRUD completeness, filter edge cases, simulated settings bridges, dead code cleanup.
- **P3 (Cosmetic & Performance)**: Animation polish, dark mode color fine-tuning, large date range query optimizations.

---

## 2. Prioritized Task Register

### Phase A: P0 Critical Blockers (Prerequisites for Execution)
| Task ID | Component | Task Description | Acceptance Criteria | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-P0-01** | Agent Build | Fix misspelled directory references in `agent/prebuild.js` and `agent/copy-latest-exe.js`. | `node prebuild.js` and `copy-latest-exe.js` resolve paths to `backend` and `frontend` without errors. | None | **READY** |
| **TSK-P0-02** | Agent Packaging | Configure electron-builder signing pipeline & self-signed cert workflow for Windows installer. | `agent/package.json` contains full NSIS & Authenticode configuration; dev cert generator script created. | TSK-P0-01 | **READY** |
| **TSK-P0-03** | Agent Imports | Clean up brittle relative module fallbacks in `agent/main.js`. | `main.js` requires dependencies cleanly from its own `node_modules` without crashing. | None | **READY** |
| **TSK-P0-04** | Agent Config | Decouple desktop agent default URL from remote Railway production backend. | `resolveServerUrl()` defaults to local backend `http://localhost:5000` with explicit config override. | None | **READY** |
| **TSK-P0-05** | Security / DB | Isolate live production Railway credentials in `backend/.env`. | Default connection string in `.env.example` points to local database; production secrets safeguarded. | None | **READY** |

### Phase B: P1 Core Telemetry & Workflows
| Task ID | Component | Task Description | Acceptance Criteria | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-P1-01** | Frontend Nav | Enable Compliance navigation item in `Sidebar.jsx`. | "Compliance" appears in Sidebar for ADMIN; clicking navigates cleanly to `/compliance`. | None | **READY** |
| **TSK-P1-02** | Frontend Config | Update `frontend/.env` to point to local backend API URL by default. | `VITE_API_URL` defaults to `http://localhost:5000/api` without requiring manual file edit. | None | **READY** |
| **TSK-P1-03** | Desktop Agent | Optimize screen capture to eliminate rapid child PowerShell process spawning. | High-frequency capture uses persistent compiled GDI+ or Electron native capture without triggering AV heuristics. | TSK-P0-03 | **READY** |
| **TSK-P1-04** | Desktop Installer | Implement clean uninstallation hooks in NSIS build configuration. | Uninstalling agent removes startup Run registry key and cleans AppData cache completely. | TSK-P0-02 | **READY** |
| **TSK-P1-05** | QA Pipeline | Add automated test scripts into `backend/package.json`. | `npm test` runs integration tests (`test_dev4_integration.js`, `verify_all.js`) and returns exit code 0. | None | **READY** |

### Phase C: P2 Incomplete Features & Settings Bridge
| Task ID | Component | Task Description | Acceptance Criteria | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-P2-01** | Code Cleanup | Remove dead unreferenced file `frontend/src/pages/temp.jsx`. | File deleted; build succeeds without broken import references. | None | **READY** |
| **TSK-P2-02** | Settings / SAML | Add clear simulation / sandbox indicator on SAML SSO configuration wizard. | Admins informed that IdP metadata exchange is in sandbox test mode until enterprise SSO credentials are provided. | None | **READY** |
| **TSK-P2-03** | Billing Modal | Clarify demo status in Subscription & Add-On billing screens. | UI displays sandbox badge; does not pretend to charge real credit cards. | None | **READY** |
| **TSK-P2-04** | Integrations | Verify Jira & ClickUp connector fallback error messages in UI when API keys are unconfigured. | Connectors show clean "API Key Required" configuration modal instead of silent timeout. | None | **READY** |

---

## 3. Implementation Order & Approval Gates

```
[Phase 1 & 2 Audit Approval]
            │
            ▼
[Gate 1: Critical Fixes P0]
  - Fix build script directory paths (TSK-P0-01)
  - Clean up agent imports & default URLs (TSK-P0-03, TSK-P0-04)
  - Configure Code-Signing & NSIS Installer pipeline (TSK-P0-02)
  - Isolate local DB / credentials (TSK-P0-05)
            │
            ▼
[Gate 2: Core Workflows P1]
  - Enable Compliance in Sidebar (TSK-P1-01)
  - Configure local Frontend API target (TSK-P1-02)
  - Optimize AV-friendly screen capture (TSK-P1-03)
  - Clean uninstallation hooks (TSK-P1-04)
  - Package test runners in backend (TSK-P1-05)
            │
            ▼
[Gate 3: Polish & Verification P2]
  - Clean dead code (TSK-P2-01)
  - Verify SAML & Billing sandbox states (TSK-P2-02, TSK-P2-03)
  - Full Regression & Verification Execution
```
