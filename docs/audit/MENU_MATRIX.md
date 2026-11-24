# Menu Matrix & Route Audit

**Project**: Employee Monitoring System (EMS) & Workforce Intelligence Platform  
**Audit Date**: 2026-11-23  
**Auditor**: Lead Software Architect & Multi-Agent Coordinator  

---

## 1. Classification & Audit Standard

Every menu, submenu, and standalone view has been traced through:
- **UI Status**: Component render, form controls, loading, empty, and error states.
- **API Status**: HTTP methods, routes, controllers, middleware, and response validation.
- **DB Status**: Prisma schema mapping, foreign key constraints, indexes, and persistence.
- **Real Functionality**: End-to-end data flow from user interaction to database commit.
- **Bugs**: Identifiable runtime, syntax, logical, or routing defects.
- **Priority**: P0 (Blocker), P1 (High), P2 (Medium), P3 (Low / Polish).
- **Test Coverage**: Existing automated script coverage or manual reproduction steps.

Status Legend: `WORKING` | `PARTIAL` | `BROKEN` | `PLACEHOLDER` | `MISSING` | `NOT VERIFIED`

---

## 2. Comprehensive Navigation & Route Audit Table

| Menu / Submenu | Route | Role | UI Status | API Status | DB Status | Real Functionality | Known Bugs / Flaws | Priority | Test Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Login** | `/login` | Public | WORKING | WORKING | WORKING | Authenticates user credentials via bcrypt, issues JWT, sets auth store. | None. | P0 | Verified via manual curl & auth controller tests. |
| **Setup Password** | `/setup-password` | Public | WORKING | WORKING | WORKING | Validates `InvitationToken`, hashes new password, updates user account. | URL query param token parsing requires exact format. | P0 | Verified in `auth.controller.js`. |
| **Setup Agent** | `/setup-agent` | Public | PARTIAL | WORKING | WORKING | Validates token, shows prefilled email, triggers `.exe` download. | Serves unsigned executable, causing Windows Defender SmartScreen warning. | P0 | Verified download endpoint `/api/agent/download`. |
| **Executive Dashboard** | `/:rolePath/` | ADMIN | WORKING | WORKING | WORKING | Renders workforce KPI cards, comparative charts, live active count. | Relies on Railway production URL if `.env` not overridden locally. | P1 | Verified in `Dashboard.jsx`. |
| **Manager Dashboard** | `/:rolePath/` | MANAGER | WORKING | WORKING | WORKING | Shows scoped metrics for assigned team members only. | None; role-filtered in `dashboardService.js`. | P1 | Verified in `dashboard.controller.js`. |
| **Personal Dashboard** | `/:rolePath/` | EMPLOYEE | WORKING | WORKING | WORKING | Displays individual hours logged, productivity %, current shift timer. | Must prevent access to admin organizational stats. | P1 | Enforced by `RoleRoute`. |
| **Monitoring Agents** | `/:rolePath/agents` | ADMIN | WORKING | WORKING | WORKING | Lists enrolled agents, device IDs, OS specs, status (active/inactive), approve/deactivate toggles. | Delete cascade must clean up orphan agent heartbeats. | P1 | Endpoints in `agent.controller.js`. |
| **Real-time Insights** | `/:rolePath/real-time` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Live employee status (online/idle/offline), live activity stream, live screenshots. | Live stream mode requires active desktop agent websocket connection. | P1 | Verified via `RealTimeContext.jsx` & Socket.IO. |
| **Alerts & Incidents** | `/:rolePath/alerts` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Live alert feed (late arrival, continuous idle, prohibited apps), dismiss & resolve actions. | Employee role is blocked from seeing manager alerts (verified). | P1 | Verified in `test_dev4_integration.js`. |
| **Employees List** | `/:rolePath/employees` | ADMIN, MANAGER, EMPLOYEE | WORKING | WORKING | WORKING | Employee cards/table, search, team filter, add employee modal, invite flow. | "Merge Employees" button only permitted for Admin (enforced in UI). | P1 | Verified in `employees.service.js`. |
| **Employee Profile** | `/:rolePath/employees/:id` | ADMIN, MANAGER, EMPLOYEE | WORKING | WORKING | WORKING | Detailed profile, 30-day activity history, attendance breakdown, assigned tasks. | Access restricted for employees to own profile only. | P1 | Verified in `EmployeeProfile.jsx`. |
| **Teams Management** | `/:rolePath/teams` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Team list, create team, assign members, team productivity average. | Non-admin edit/delete buttons properly hidden. | P2 | Verified in `teams.controller.js`. |
| **Screenshots Review** | `/:rolePath/screenshots` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Grid/timeline of captured employee screens, date slider, blur toggle. | Video tab placeholder if local ffmpeg stream is unavailable. | P1 | Verified in `screenshots.controller.js`. |
| **Time & Attendance** | `/:rolePath/time-attendance` | ADMIN, MANAGER, EMPLOYEE | WORKING | WORKING | WORKING | Shift calendar, clock-in/out records, late flags, manual time requests, leave balances. | Overtime calculation needs explicit timesheet submission. | P1 | Verified in `attendance.service.js`. |
| **Activities Timeline** | `/:rolePath/activities` | ADMIN, MANAGER, EMPLOYEE | WORKING | WORKING | WORKING | Hour-by-hour color-coded blocks (active, idle, manual, break). | Large date ranges (>90 days) can be slow to render without pagination. | P2 | Verified in `ActivitiesTimeline.jsx`. |
| **Activity Monitoring** | `/:rolePath/monitoring` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Live app usage logs, window titles, keystrokes/mouse count telemetry. | None. | P1 | Verified in `ActivityMonitoring.jsx`. |
| **Projects** | `/:rolePath/projects` | ADMIN, MANAGER, EMPLOYEE | WORKING | WORKING | WORKING | Project directory, budgets, billable rates, team assignments, logged hours. | Non-admins restricted from modifying billable hourly rates. | P1 | Verified in `projects.controller.js`. |
| **Tasks & Kanban** | `/:rolePath/tasks` | ADMIN, MANAGER, EMPLOYEE | WORKING | WORKING | WORKING | Kanban board (Backlog, In Operations, QA, Finalized), drag-and-drop status update. | Real-time transitions recorded in `task_status_history`. | P1 | Verified in `tasks.service.js` & `verify_all.js`. |
| **Report: Work Type** | `/:rolePath/reports/work-type` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Breakdown of core vs non-core hours, productive time distribution. | CSV/Excel export functional via `exportEngine.js`. | P2 | Verified in `WorkType.jsx`. |
| **Report: Schedule Adherence** | `/:rolePath/reports/schedule-adherence` | ADMIN, MANAGER | WORKING | WORKING | WORKING | On-time clock-in %, missed shifts, early departures vs scheduled hours. | Requires shifts to be configured in database. | P2 | Verified in `ScheduleAdherence.jsx`. |
| **Report: Workload Distribution** | `/:rolePath/reports/workload-distribution` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Overburdened vs underutilized employee task allocation analysis. | None. | P2 | Verified in `WorkloadDistribution.jsx`. |
| **Report: Apps & Websites** | `/:rolePath/reports/apps-websites` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Top application usage breakdown, category filters, domain rankings. | Uses `AppUsageLog` aggregation in backend. | P1 | Verified in `AppsWebsites.jsx`. |
| **Report: Office vs Remote** | `/:rolePath/reports/location-insights` | ADMIN, MANAGER | WORKING | WORKING | WORKING | In-office vs remote work time comparison, office attendance threshold analysis. | Requires location coordinates or office work zones. | P2 | Verified in `LocationInsights.jsx`. |
| **Report: Process Mining** | `/:rolePath/reports/process-mining` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Workflow cycle time analytics, stage-by-stage average duration, primary bottleneck identification. | Backed by `task_status_history` queries. | P1 | Verified in `test_dev4_complete_e2e.js`. |
| **Location & Fleet Tracking** | `/:rolePath/location` | ADMIN, MANAGER, EMPLOYEE | WORKING | WORKING | WORKING | Interactive Leaflet map with employee pins, status (moving/stationary), work zone geofences. | GPS coordinates fallback to simulated telemetry if hardware lacks GPS chip. | P2 | Verified in `LocationTracking.jsx`. |
| **Payroll Management** | `/:rolePath/payroll` | ADMIN | WORKING | WORKING | WORKING | Aggregates active hours * rate, invoices table, payment status toggles (PAID/UNPAID). | Invoice PDF generation requires pdfkit on server. | P1 | Verified in `payroll.service.js`. |
| **Compliance & Readiness** | `/:rolePath/compliance` | ADMIN | PARTIAL | WORKING | WORKING | SOC 2 & ISO 27001 readiness checklists, compliance controls, system audit log viewer. | **CRITICAL BUG**: Navigation link is commented out in `Sidebar.jsx`. | P1 | Route exists in `App.jsx`, page in `Compliance.jsx`. |
| **Notifications Center** | `/:rolePath/notifications` | ADMIN, MANAGER, EMPLOYEE | WORKING | WORKING | WORKING | Dedicated full notification center view with filters (all, unread, alerts, info). | None; supports single delete and mark-all-read. | P2 | Verified in `Notifications.jsx`. |
| **Settings Landing** | `/:rolePath/settings` | ADMIN | WORKING | WORKING | WORKING | Card-based configuration portal linking to all settings modules. | Search filter works dynamically across cards. | P2 | Verified in `Settings.jsx`. |
| **Settings: Organization** | `/:rolePath/settings/organization` | ADMIN | WORKING | WORKING | WORKING | Company name, timezone, working days, standard work hours (09:00 - 18:00). | Changes affect schedule adherence calculations. | P1 | Verified in `organization.service.js`. |
| **Settings: Productivity Rules** | `/:rolePath/settings/productivity/apps` | ADMIN, MANAGER | WORKING | WORKING | WORKING | Domain/app classification table, productive/unproductive/neutral toggles, team overrides. | 3-column unique index `(organizationId, domain, teamId)` in MySQL. | P1 | Verified in `verify_all.js`. |
| **Settings: Tracking** | `/:rolePath/settings/tracking` | ADMIN | WORKING | WORKING | WORKING | Screenshots per hour, idle threshold, visibility mode (visible/stealth), permissions. | Stealth mode toggle in agent must respect OS transparency guidelines. | P1 | Verified in `tracking.service.js`. |
| **Settings: Advanced Tracking** | `/:rolePath/settings/tracking/advanced` | ADMIN | WORKING | WORKING | WORKING | Shift threshold, hardware identification mode (hwid), Active Directory sync flags. | Active Directory sync requires LDAP connector in enterprise tier. | P2 | Backed by `AdvancedTrackingSetting`. |
| **Settings: User Management** | `/:rolePath/settings/user-management/users` | ADMIN | WORKING | WORKING | WORKING | User list, role modification (ADMIN, MANAGER, EMPLOYEE), password reset trigger. | Prevents deleting the last remaining admin. | P1 | Verified in `ManageUsers.jsx`. |
| **Settings: Org Groups** | `/:rolePath/settings/user-management/org-groups` | ADMIN | WORKING | WORKING | WORKING | Department and team hierarchy management. | Integrated with teams table. | P2 | Verified in `ManageOrgGroups.jsx`. |
| **Settings: Audit Logs** | `/:rolePath/settings/audit-logs` | ADMIN | WORKING | WORKING | WORKING | Searchable table of administrative actions, user authentication events, IP addresses. | Immutable; no delete operation provided (by security design). | P1 | Backed by `AuditLog`. |
| **Settings: Email Reports** | `/:rolePath/settings/email-reports` | ADMIN | WORKING | WORKING | WORKING | Automated daily/weekly PDF email dispatch configuration, recipient list, content checkboxes. | Requires valid SMTP credentials in backend `.env`. | P1 | Verified in `test_dev4_integration.js`. |
| **Settings: Manual Time Config** | `/:rolePath/settings/manual-time` | ADMIN | WORKING | WORKING | WORKING | Organization-wide manual time entry allowance and approval rules. | None. | P2 | Backed by `manual_time_entries`. |
| **Settings: Privacy & GDPR** | `/:rolePath/settings/privacy` | ADMIN | WORKING | WORKING | WORKING | GDPR toggle, data retention period (days), screenshot blur level, URL tracking toggle. | Nightly cleanup scheduler triggers based on retention period. | P1 | Backed by `ComplianceSetting`. |
| **Settings: Billing & Plans** | `/:rolePath/settings/billing` | ADMIN | PARTIAL | PLACEHOLDER | PLACEHOLDER | Subscription plans (Starter, Growth, Enterprise), seat count slider, add-on features. | Demo / simulated state; payment processing (Stripe) is mock. | P2 | Backed by `billingStore.js`. |
| **Settings: Alert Rules** | `/:rolePath/settings/alerts` | ADMIN | WORKING | WORKING | WORKING | Sub-tabs for Attendance Alerts, Security Alerts, Shift Scheduling, Other Alerts. | Alerts engine dynamically evaluates events against these rules. | P1 | Verified in `alerts.service.js`. |
| **Settings: Security & SAML** | `/:rolePath/settings/security` | ADMIN | PARTIAL | PARTIAL | PARTIAL | 2FA toggle, password policy settings, SAML SSO setup wizard (`SamlWizard.jsx`). | SAML wizard UI is complete; Okta/Azure AD IdP callback is simulated. | P2 | Backed by `securityStore.js`. |
| **Settings: Integrations** | `/:rolePath/settings/integrations` | ADMIN | PARTIAL | WORKING | WORKING | Connectors for Jira, ClickUp, Slack, Calendar, Data Warehouse. | Webhook verification & normalization working; live sync needs API keys. | P2 | Verified in `verify_all.js`. |
| **Settings: Utilization** | `/:rolePath/settings/utilization` | ADMIN | WORKING | WORKING | WORKING | Optimal workload benchmark configuration (default: 60% - 85%). | Informs workload distribution report. | P2 | Backed by `ReportSetting`. |
| **Settings: Personal** | `/:rolePath/settings/personal` | ALL | WORKING | WORKING | WORKING | Profile avatar, full name, email, password update, localization preferences. | Users can edit their own display name & password. | P2 | Verified in `PersonalSettings.jsx`. |
| **Employee Work Session** | `/employee/work-session` | EMPLOYEE | WORKING | WORKING | WORKING | Dedicated active session status view informing employee of active monitoring. | Transparent indicator complying with authorized monitoring guidelines. | P1 | Enforced via `WorkSessionRequired.jsx`. |
