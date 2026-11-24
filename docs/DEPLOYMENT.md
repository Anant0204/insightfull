# Deployment & Operations Guide

**Project:** Insightfull — Employee Monitoring System
**Last updated:** 2026-11-24 (post security remediation)

---

## 1. Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default 5000) | API port |
| `DATABASE_URL` | **Yes** | MySQL connection string `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | **Yes (production)** | Server refuses to boot in production without it. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | Yes | `production` / `development` |
| `FRONTEND_URL` | **Yes** | Comma-separated CORS allowlist, e.g. `https://app.client.com` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Recommended | Screenshot cloud storage. Without these, screenshots fall back to local disk (served only via signed URLs) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Recommended | Without these, emails are SIMULATED (logged, not delivered) and a boot warning is printed |
| `API_PUBLIC_URL` | Recommended | Public URL of the backend (used in emails/installer) |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes (production)** | e.g. `https://api.client.com/api`. Defaults to `http://localhost:5000/api` |

### Desktop Agent
Server URL resolution order (first match wins):
1. `API_URL` environment variable
2. `server-config.json` next to the executable (`{ "SERVER_URL": "https://api.client.com" }`)
3. Fallback: `http://localhost:5000`

Set `server-config.json` before building the installer for the client's environment. Invalid URLs are rejected with a warning.

---

## 2. Database Migrations (baseline strategy)

The project uses a **baseline migration**: `backend/prisma/migrations/000000000000_baseline/migration.sql`
was generated from `schema.prisma` and matches the current production schema.

**Existing database (already has data — e.g. restored from dump):**
```bash
# 1. BACKUP FIRST (see section 3)
# 2. Mark the baseline as applied WITHOUT running it:
npx prisma migrate resolve --applied 000000000000_baseline
# 3. Future schema changes:
npx prisma migrate dev --name <change_name>
```

**Fresh empty database:**
```bash
npx prisma migrate deploy
```

**Rules:** never run `prisma migrate reset` or `db push --force-reset` against real data;
always test migrations on a staging copy first; always take a verified backup before migrating.

---

## 3. Backup & Recovery

**Backup (MySQL/MariaDB):**
```bash
mysqldump -u <user> -p <database> > backup_$(date +%F).sql
```
Also back up `backend/public/uploads/` if Cloudinary is not configured (local screenshot storage).

**Restore:**
```bash
mysql -u <user> -p <database> < backup_YYYY-MM-DD.sql
```

**Recovery checklist:** restore DB → restore uploads dir → set env vars → `npx prisma generate && npx prisma migrate resolve --applied 000000000000_baseline` → start server → verify `/api/agent/health`.

---

## 4. Credential Rotation Checklist (manual, provider dashboards)

The following credentials were exposed in git history (commit `4a5e292`) and MUST be rotated
before client delivery. Deleting them from source does NOT invalidate them.

- [ ] **Cloudinary** (`cloud_name: dw48hcxi5`): Cloudinary Dashboard → Settings → API Keys →
      regenerate API secret. Consider migrating screenshots to a fresh cloud/account, since old
      delivery URLs remain publicly accessible.
- [ ] **Railway MySQL**: rotate the database password (Railway → service → Variables → regenerate)
      or decommission the old database if migrating.
- [ ] **Any JWT_SECRET** that was ever committed or shared → generate a fresh one per environment.
- [ ] After rotation: update `backend/.env` (never commit it), redeploy, verify uploads/login.
- [ ] Optional hardening: rewrite git history (`git filter-repo`) or recreate the repo to purge
      secrets from history — coordinate with all collaborators first.

---

## 5. Desktop Agent Code Signing (manual, certificate required)

The agent installer is currently unsigned; Windows SmartScreen will warn users.

1. Obtain a code-signing certificate (OV/EV) from a trusted CA (e.g. DigiCert, Sectigo).
   EV certificates give immediate SmartScreen reputation.
2. Store the certificate securely (hardware token / CI secret store) — never in the repo.
3. Configure `agent/package.json` → electron-builder:
   ```json
   "win": { "certificateFile": "<path-from-secure-store>", "signingHashAlgorithms": ["sha256"] }
   ```
   or set `CSC_LINK` / `CSC_KEY_PASSWORD` environment variables in the release pipeline.
4. Build with `npm run dist` inside `agent/` on the authorized release machine.
5. Verify: `signtool verify /pa "EMS-Tracker-latest.exe"`.
6. Update `GITHUB_AGENT_DOWNLOAD_URL` in `backend/src/modules/agent/agent.controller.js`
   to the client's release location, and rebuild/redeploy the backend.

---

## 6. Production Startup Checklist

1. `backend/.env` fully populated (see section 1) — server **will refuse to boot** without `JWT_SECRET` in production.
2. `npm ci && npx prisma generate && npx prisma migrate deploy` (backend).
3. `npm ci && npm run build` (frontend) — serve `dist/` behind the same origin as `FRONTEND_URL` or add its origin to `FRONTEND_URL`.
4. Start backend; verify boot log has **no** `[SECURITY]` or `[EmailService] SMTP is not configured` warnings.
5. Smoke test: login → dashboard → screenshots page → invite a test employee.
6. Install desktop agent with correct `server-config.json`; verify heartbeat in Monitoring Agents page.
