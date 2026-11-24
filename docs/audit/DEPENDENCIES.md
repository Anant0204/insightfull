# Dependency Health & Environment Audit

**Project**: Employee Monitoring System (EMS) & Workforce Intelligence Platform  
**Audit Date**: 2026-11-23  
**Auditor**: Lead Software Architect & Multi-Agent Coordinator  

---

## 1. System Runtime Requirements

| Dependency | Required Version | Detected Environment | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (LTS) | `v22.17.0` | **COMPATIBLE** | High performance runtime, supports modern ES modules and native fetch. |
| **npm** | `>= 9.0.0` | `10.9.2` | **COMPATIBLE** | Package manager verified. |
| **Git** | `>= 2.30.0` | `2.41.0.windows.1` | **COMPATIBLE** | Clean baseline repository initialized on `audit-and-fix`. |
| **Windows OS** | Windows 10 / 11 (x64) | Windows (x64) | **COMPATIBLE** | Target platform for desktop employee agent installer. |
| **PowerShell** | `>= 5.1` | PowerShell 5.1 / Core | **COMPATIBLE** | Required for foreground window detection and GDI+ screen capture fallback. |
| **.NET Framework**| `>= 4.5` | Standard on Win 10/11 | **COMPATIBLE** | Required for Win32 API interop (`System.Windows.Forms`, `System.Drawing`). |
| **Database** | MySQL `>= 8.0` | Target: MySQL | **ACTION REQUIRED** | Default `.env` points to remote Railway; local MySQL instance or test adapter needed for local execution. |

---

## 2. Desktop Agent Dependencies (`agent/package.json`)

```json
{
  "name": "insightful-agent",
  "version": "1.0.2",
  "main": "main.js"
}
```

### Runtime Dependencies
| Package | Declared Version | Purpose | Risk Assessment |
| :--- | :--- | :--- | :--- |
| `axios` | `^1.6.8` | HTTP client for telemetry ingestion & heartbeats | Low risk; stable HTTP library. |
| `dotenv` | `^17.4.2` | Environment variable parsing | Low risk; standard utility. |
| `electron-log` | `^5.4.4` | Structured logging across main and renderer | Low risk; essential for crash troubleshooting. |
| `os` | `^0.1.2` | System utilities (redundant with Node native `os`) | Redundant package; Node.js provides built-in `os` module. Recommend removing from package.json to avoid confusion. |
| `screenshot-desktop` | `^1.12.7` | Cross-platform screen capture wrapper | Medium risk; historically bundles `.bat` scripts on Windows that trigger false-positive AV warnings. Native Windows GDI+ / Electron capture is preferred. |
| `socket.io-client` | `^4.8.3` | Real-time WebSocket connection to backend | Low risk; aligns with server Socket.IO version. |

### Development Dependencies
| Package | Declared Version | Purpose | Risk Assessment |
| :--- | :--- | :--- | :--- |
| `electron` | `^29.3.1` | Desktop runtime framework | Stable LTS version; modern Chromium & V8 security baseline. |
| `electron-builder` | `^24.6.3` | Packaging, installer creation & code-signing | Requires configuration tuning for Authenticode signing and NSIS uninstall hooks. |

---

## 3. Backend Service Dependencies (`backend/package.json`)

```json
{
  "name": "dsp-performance-backend",
  "version": "1.0.0",
  "main": "src/server.js"
}
```

### Runtime Dependencies
| Package | Declared Version | Purpose | Risk Assessment |
| :--- | :--- | :--- | :--- |
| `@prisma/client` | `^5.16.2` | Type-safe ORM client for MySQL database | Aligns with `prisma` CLI version. |
| `express` | `^5.2.1` | Next-generation web framework | Express 5 has native Promise rejection handling in middleware; ensures robust error handling. |
| `bcrypt` | `^6.0.0` | Password hashing for authentication | Native C++ bindings (node-gyp); pre-compiled binary available for Windows x64. |
| `jsonwebtoken` | `^9.0.3` | Authentication tokens generation and decoding | Standard industry JWT library. |
| `socket.io` | `^4.8.3` | Real-time bi-directional event engine | Stable WebSocket implementation. |
| `sharp` | `^0.34.5` | High-performance image resizing & compression | Native libvips bindings; excellent for fast JPEG compression of employee screenshots. |
| `multer` | `^2.1.1` | Multipart form-data handling for screenshot uploads | Standard upload middleware. |
| `pdfkit` | `^0.20.2` | Automated PDF workforce intelligence report creation | Pure JS PDF generator; no external binary dependencies. |
| `nodemailer` | `^8.0.2` | SMTP email dispatch for automated reports | Standard email library. |
| `node-cron` | `^4.2.1` | Schedulers for screenshot cleanup & report dispatch | Lightweight in-memory scheduler. |
| `zod` | `^3.23.8` | Schema validation for incoming request payloads | Modern type-safe validator. |
| `cloudinary` | `^2.9.0` | Optional cloud storage for screenshots | Fallback cloud storage provider. |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing middleware | Standard security middleware. |
| `dotenv` | `^17.3.1` | Environment variable loader | Standard utility. |

### Development Dependencies
| Package | Declared Version | Purpose | Risk Assessment |
| :--- | :--- | :--- | :--- |
| `nodemon` | `^3.1.9` | Auto-reloading dev server | Standard development tool. |
| `prisma` | `^5.16.2` | Schema migration & client code generator | Must match `@prisma/client`. |

---

## 4. Frontend Web Dependencies (`frontend/package.json`)

```json
{
  "name": "dsp-performance-software",
  "version": "0.1.0",
  "type": "module"
}
```

### Runtime Dependencies
| Package | Declared Version | Purpose | Risk Assessment |
| :--- | :--- | :--- | :--- |
| `react` / `react-dom` | `^18.2.0` | React component library | Stable enterprise standard. |
| `react-router-dom` | `^6.21.0` | Client-side routing with role-based routing | Stable routing engine. |
| `zustand` | `^5.0.11` | Reactive state management stores | Lightweight, modular store architecture. |
| `axios` | `^1.13.6` | HTTP client with bearer token interceptors | Standard client. |
| `socket.io-client` | `^4.8.3` | Real-time WebSocket connection to server | Matches backend version. |
| `recharts` | `^2.10.3` | Charts & analytics data visualization | Standard React SVG chart library. |
| `lucide-react` | `^0.300.0` | Iconography | Modern icon suite. |
| `leaflet` / `react-leaflet` | `^1.9.4` / `^4.1.0` | GPS map and location tracking view | Lightweight open-source map engine. |
| `jspdf` / `jspdf-autotable` | `^4.2.1` / `^5.0.9` | Client-side PDF export of tables & reports | Client-side document export. |
| `xlsx` | `^0.18.5` | Client-side Excel (.xlsx) report export | Spreadsheet data generation. |
| `tailwind-merge` / `clsx` | `^2.2.0` / `^2.1.0` | Dynamic classname concatenation | Tailwind styling utilities. |
| `date-fns` | `^4.1.0` | Date manipulation and timezone formatting | Modern modular date utility. |

### Optional / Tooling Dependencies
| Package | Declared Version | Purpose |
| :--- | :--- | :--- |
| `vite` | `^5.0.10` | Fast build tool & dev server |
| `@vitejs/plugin-react-swc` | `^3.5.0` | SWC compiler for rapid React compilation |
| `tailwindcss` | `^3.4.0` | Utility-first CSS framework |
| `@rollup/rollup-win32-x64-msvc` | `^4.57.1` | Native Windows x64 binary for Rollup bundling |

---

## 5. Potential Dependency Vulnerabilities & Action Items

1. **Redundant `os` Package in Desktop Agent**:
   - `agent/package.json` declares `"os": "^0.1.2"`. Node.js provides a built-in `os` module. This third-party stub package is obsolete and can safely be removed.
2. **Missing Test Harness**:
   - Neither `backend` nor `agent` declare a test runner (such as Jest or Mocha) in `devDependencies`. However, native Node.js test runners (`node:test`) or simple verification scripts (`test_dev4_integration.js`, `verify_all.js`) run cleanly under `node`.
3. **Rollup Windows Native Binary**:
   - Frontend includes `@rollup/rollup-win32-x64-msvc` in `optionalDependencies`, ensuring smooth, zero-compilation Vite builds on Windows without requiring Visual C++ Build Tools.
