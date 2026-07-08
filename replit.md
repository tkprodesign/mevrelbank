# Project Overview

This repository contains two projects:

## 1. AICG — AI Context Gateway (`aicg/`)

A secure, read-only Node.js/Express intelligence gateway that gives an authorized AI session autonomous access to a GitHub repository (search, read files, navigate folders, inspect the tree). It never modifies the repository.

### Stack
- Node.js 20 / Express 5
- `@octokit/rest` for GitHub API access
- `bcrypt`, `uuid`, `dotenv`

### Required Secrets (Replit Secrets)
| Secret | Purpose |
|---|---|
| `G_TOKEN` | GitHub personal access token (read-only scope) |
| `SESSION_SECRET` | Authorization credential — present this to `POST /authorize` |

### Run
Workflow: **Start application** → `cd aicg && node server.js` (port 3000)

### Session Flow
1. `POST /authorize` with `{ "token": "<SESSION_SECRET>" }` → returns `{ "sessionId": "..." }`
2. All subsequent requests include header `X-Session-ID: <sessionId>`
3. `POST /invalidate` to terminate the session

Only **one** active session exists at any time. A new `/authorize` call invalidates the previous session.

### Endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | — | Service identity |
| GET | `/health` | — | Liveness probe |
| POST | `/authorize` | token | Exchange token for session ID |
| POST | `/invalidate` | session | Terminate active session |
| GET | `/tree` | session | Full repository tree (blocked paths stripped) |
| GET | `/folder?path=<path>` | session | List folder contents |
| GET | `/file?path=<path>` | session | Read and decode a file |
| GET | `/search?q=<query>&mode=<filename\|code\|both>` | session | Search repository |

### Blocked Paths
`.github/`, `.env*`, `secrets/` — always returns 403 regardless of session.

---

## 2. MevrelBank (`mevrelbank/`)

A digital banking platform currently in **Phase 0 — Foundation** (brand identity & design system planning). No runnable code yet.

### Status
- ✅ Brand architecture & logo system complete
- ⏳ Design system / color system / typography in progress
- ⬜ Public website, auth, customer dashboard — planned

### Planned Hosting
- Frontend: Cloudflare Pages
- Backend: Railway
- Database: Neon PostgreSQL
- Storage: Cloudflare R2

See `mevrelbank/roadmap.md` for the full phased plan.

---

## User Preferences

_None recorded yet._
