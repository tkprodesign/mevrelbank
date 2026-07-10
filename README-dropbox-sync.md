# GitHub → Dropbox Smart Sync

Automatically mirrors this GitHub repository to a configured Dropbox folder on every push to `main`.

## Features

- **Non-destructive** — orphan Dropbox files are archived, never deleted
- **Full hierarchy preserved** — directory structure is replicated exactly
- **Smart comparison** — only new and modified files are uploaded
- **Auto folder creation** — missing Dropbox folders are created on the fly
- **Collision-safe archive** — UTC timestamps prevent overwriting archived files
- **Retry logic** — transient Dropbox API failures are automatically retried
- **Detailed logs** — every step is logged with timestamps and status levels
- **Modular design** — each concern is in its own JavaScript module

## Quick Start

### 1. Set GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `DROPBOX_ACCESS_TOKEN` | Your Dropbox API access token |
| `DROPBOX_ROOT_FOLDER` | Destination folder in Dropbox (e.g. `TK Pro Enterprise OS`) |

See [docs/configuration.md](docs/configuration.md) for how to generate a Dropbox token.

### 2. Push to main

The workflow runs automatically. Check the **Actions** tab for logs and the final summary.

## Project Structure

```
.github/
├── workflows/
│   ├── dropbox-sync.yml           ← main workflow (triggered on push)
│   └── bootstrap-dropbox-sync.yml ← one-time bootstrap (can be removed)
└── scripts/
    ├── config.js        ← reads & validates secrets
    ├── logger.js        ← structured logging
    ├── utils.js         ← shared helpers (hashing, retry, paths)
    ├── dropbox.js       ← Dropbox SDK wrapper
    ├── scanner.js       ← repo file scanner
    ├── compare.js       ← diff engine
    ├── archive.js       ← orphan archiver
    ├── upload.js        ← file uploader
    └── dropbox-sync.js  ← main orchestrator

docs/
├── architecture.md      ← module map and data flow
├── configuration.md     ← secrets setup guide
├── archive-system.md    ← archive behavior and collision handling
└── workflow.md          ← step-by-step workflow reference

package.json
README-dropbox-sync.md   ← this file
```

## Sync Summary (example output)

```
────────────────────────────────────────────────────────────
  Sync Summary
────────────────────────────────────────────────────────────
  Files Scanned     :   142
  Dropbox Files     :   138
  New Files         :     5
  Updated Files     :    12
  Archived Files    :     3
  Skipped Files     :     0
  Errors            :     0
  Duration          :  14.2s
────────────────────────────────────────────────────────────
[SUCCESS] 2026-07-08T20:01:02Z Run completed successfully.
```

## Documentation

| Document | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Module map, data flow, extension points |
| [docs/configuration.md](docs/configuration.md) | Secrets setup and local testing |
| [docs/archive-system.md](docs/archive-system.md) | Archive behavior and file restoration |
| [docs/workflow.md](docs/workflow.md) | Workflow steps and error handling |

## Local Testing

```bash
export DROPBOX_ACCESS_TOKEN="your-token"
export DROPBOX_ROOT_FOLDER="TK Pro Enterprise OS"
npm ci
node .github/scripts/dropbox-sync.js
```

## Planned Features

- Dry-run mode
- Selective folder syncing
- `.dropboxignore` support
- Archive cleanup / restore commands
- Scheduled sync
- Manual dispatch with options
- Notifications (Slack / Discord / Email)
- Multiple Dropbox destinations

## Changelog

### 2026-07-08 — Copilot Coding Agent — Initial implementation
Full GitHub → Dropbox Smart Sync system built (S-01). Modular scripts under `.github/scripts/`. PR #1.
