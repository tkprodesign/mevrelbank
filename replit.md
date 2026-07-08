# Project Overview

This repository contains two projects:

## 1. AICG — AI Context Gateway (`aicg/`)

A Node.js/Express server (v0.1.0) that acts as a gateway for AI context operations, integrating with GitHub via Octokit.

### Stack
- Node.js 20 / Express 5
- `@octokit/rest` for GitHub API access
- `bcrypt` for password hashing
- `uuid` for session IDs
- `dotenv` for environment config

### Required Secrets
- `GITHUB_TOKEN` — GitHub personal access token
- `SESSION_SECRET` — Session signing secret *(already set in Replit Secrets)*

### Run
```bash
cd aicg && npm install && npm start
```
Starts on port `3000` (or `$PORT`).

### Endpoints
- `GET /` — Service info
- `GET /health` — Health check

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
