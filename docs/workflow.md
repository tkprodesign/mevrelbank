# Workflow

## Trigger

The sync runs automatically on every push to the `main` branch.  
It can also be triggered manually from the **Actions** tab using `workflow_dispatch`.

To change the branch, edit `.github/workflows/dropbox-sync.yml`:

```yaml
on:
  push:
    branches:
      - main   # ← change this
```

## Steps

### 1. Checkout Repository

The full repository is checked out so every file is available for scanning.

### 2. Setup Node.js

Node.js 20 is installed. The `npm` cache is used to speed up subsequent runs.

### 3. Install Dependencies

```bash
npm ci
```

Installs the Dropbox SDK (`dropbox`) and any other dependencies defined in `package.json`.

### 4. Run Dropbox Sync

```bash
node .github/scripts/dropbox-sync.js
```

The orchestrator runs the full sync pipeline:

| Step | What happens |
|---|---|
| Load config | Reads and validates `DROPBOX_ACCESS_TOKEN` and `DROPBOX_ROOT_FOLDER` |
| Scan repo | Recursively walks the repository, collecting file metadata and SHA-256 hashes |
| Scan Dropbox | Lists all files under the configured Dropbox root, ignoring the archive folder |
| Compare | Classifies files as new, modified, unchanged, or orphaned |
| Upload | Uploads new and modified files to Dropbox; creates folders as needed |
| Archive | Moves orphaned Dropbox files into `.github-sync-archive/` |
| Summary | Prints a final count table and exits 0 (success) or 1 (errors) |

### 5. Print Summary

A final confirmation message is always printed, even if earlier steps fail.

## Error Handling

| Scenario | Behavior |
|---|---|
| Missing secret | Fatal — exits immediately with a helpful message |
| Auth failure (401) | Fatal — exits immediately |
| Single file upload failure | Warning logged, run continues |
| Single archive failure | Warning logged, run continues |
| Transient API failure | Retried up to 3 times with exponential back-off |

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | All operations succeeded |
| `1` | One or more errors occurred (partial run) |

## Permissions

The workflow only requests `contents: read` — it never writes to the repository.

## Secrets Required

Both secrets must be set before the workflow will succeed:

- `DROPBOX_ACCESS_TOKEN`
- `DROPBOX_ROOT_FOLDER`

See `docs/configuration.md` for setup instructions.
