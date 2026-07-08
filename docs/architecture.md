# Architecture

## Overview

The GitHub → Dropbox Smart Sync System automatically mirrors a GitHub repository into a configured Dropbox folder on every push to the main branch. It is designed to be safe, modular, and non-destructive.

## Principles

- **Non-destructive** — files are never permanently deleted; orphans are archived.
- **Modular** — each responsibility lives in its own module under `.github/scripts/`.
- **Orchestration-only workflow** — the YAML file only wires steps together; all business logic is in JavaScript.
- **Configurable root** — all operations are scoped to a single Dropbox folder set via secrets.
- **Resilient** — transient API failures are retried; single-file failures do not abort the run.

## Module Map

```
.github/scripts/
├── config.js        — reads & validates secrets, exports config object
├── logger.js        — structured console logging (INFO/WARNING/ERROR/SUCCESS)
├── utils.js         — hashing, path helpers, retry logic, timestamp formatting
├── dropbox.js       — Dropbox SDK wrapper (listFolder, upload, move, ensureFolder …)
├── scanner.js       — recursive local repo scanner
├── compare.js       — diff engine: new / modified / orphan classification
├── archive.js       — moves orphan Dropbox files into archive folder
├── upload.js        — uploads new and modified files to Dropbox
└── dropbox-sync.js  — main entry point / orchestrator
```

## Data Flow

```
push → workflow trigger
         │
         ▼
    Checkout repo
         │
         ▼
    scanRepo()          ← scans .github/scripts/scanner.js
         │
         ▼
    listFolder()        ← Dropbox API via dropbox.js
         │
         ▼
    compare()           ← compare.js
    ┌────┴──────────────────────────────────┐
    │                                       │
    ▼                                       ▼
uploadAll()                          archiveOrphans()
(upload.js)                           (archive.js)
    │                                       │
    └────────────────┬──────────────────────┘
                     │
                     ▼
               logger.summary()
```

## Dropbox Path Convention

All Dropbox paths are absolute and start with `/`:

```
/TK Pro Enterprise OS/src/components/button.tsx
/TK Pro Enterprise OS/.github-sync-archive/src/old-file.tsx
```

Relative paths (used for comparison) strip the root prefix:

```
src/components/button.tsx
```

## Extension Points

The system is designed so future features can be added by:

- Adding a new module under `.github/scripts/`
- Wiring it into `dropbox-sync.js` without touching other modules
- Adding new secrets without changing logic

See `docs/workflow.md` for the full workflow description.
