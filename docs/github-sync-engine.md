# GitHub Sync Engine v1

GitHub Sync Engine v1 is reusable repository synchronization infrastructure. It mirrors the current branch from this repository to a configured target GitHub repository when new commits arrive.

The current target is configured as `codywoods8899/mevrelbank` in `.github/sync-config.json`.

## Architecture

The engine is implemented by `.github/workflows/sync-engine.yml` and configured by `.github/sync-config.json`.

At a high level, each run does the following:

1. Starts on `push` or manual `workflow_dispatch`.
2. Skips runs created by `github-actions[bot]` or by commits that contain a skip marker.
3. Checks out this repository with complete history using `actions/checkout@v4` and `fetch-depth: 0`.
4. Reads `.github/sync-config.json` for the target owner, target repository, and default branch.
5. Determines the current branch and source `HEAD` SHA.
6. Clones the target repository into a temporary directory using `SYNC_PAT`.
7. Fetches all target branches and resolves the target branch SHA if it exists.
8. Compares the source branch `HEAD` SHA to the target branch `HEAD` SHA.
9. Exits successfully without pushing when both SHAs match.
10. Pushes only the current branch to the target repository when the SHAs differ or when the branch does not exist in the target.

The workflow intentionally does not push tags, does not mirror all branches, and does not write application files.

## Configuration

Configuration lives in `.github/sync-config.json`:

```json
{
  "targetOwner": "codywoods8899",
  "targetRepo": "mevrelbank",
> Infrastructure documentation for the automated repository synchronization system.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Loop Prevention](#loop-prevention)
3. [Required Secrets](#required-secrets)
4. [Changing the Target Repository](#changing-the-target-repository)
5. [Disabling Synchronization](#disabling-synchronization)
6. [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌──────────────────────────────────────────────┐
│         codywoods8899/mevrelbank              │
│               (PRIMARY)                       │
│                                              │
│  on: push / workflow_dispatch                │
│         │                                    │
│         ▼                                    │
│  ┌─────────────────────────────────────┐     │
│  │       sync-engine.yml               │     │
│  │                                     │     │
│  │  1. Read .github/sync-config.json   │     │
│  │  2. Capture source branch + SHA     │     │
│  │  3. Fetch target HEAD SHA           │     │
│  │  4. Compare SHAs                    │     │
│  │  5. Push if different               │     │
│  └──────────────┬──────────────────────┘     │
└─────────────────┼────────────────────────────┘
                  │  git push --force (SYNC_PAT)
                  ▼
┌──────────────────────────────────────────────┐
│         tkprodesign/mevrelbank               │
│               (TARGET)                        │
└──────────────────────────────────────────────┘
```

### Key design decisions

| Decision | Rationale |
|----------|-----------|
| `git ls-remote` instead of a full clone | Avoids downloading the entire target history just to read its HEAD SHA — much faster and lighter. |
| `--force` push | The primary repository is authoritative. On divergence (e.g. manual edits on the target), primary wins. |
| Read config from JSON | Target coordinates are never hard-coded in the workflow — change the JSON, not the YAML. |
| `SYNC_PAT` instead of `GITHUB_TOKEN` | `GITHUB_TOKEN` cannot push to external repositories. A PAT with `repo` scope on the target is required. |
| `fetch-depth: 0` on checkout | Ensures the full branch history is present so `git push` can send all missing commits. |

---

## Loop Prevention

Synchronization loops are prevented by **two independent layers**.

### Layer 1 — Actor check (job `if`)

```yaml
if: github.actor != 'github-actions[bot]'
```

When the target repository's own sync workflow pushes back to the primary
repository, that push is made by `github-actions[bot]`. The job-level
condition immediately stops the workflow before any steps execute.

This covers the most common loop scenario with zero compute cost.

### Layer 2 — SHA comparison (step `Compare SHAs`)

Before any push is attempted, the workflow reads the target branch's current
`HEAD` SHA using `git ls-remote`. If it matches the source SHA the push step
is skipped. This means:

- After a successful sync both sides share the same SHA.
- Any subsequent trigger (e.g. a re-run) does nothing.
- Works even if Layer 1 is somehow bypassed.

### Layer 3 — Commit message marker (optional manual bypass)

Including `[skip sync]` in a commit message prevents synchronization for
that specific commit. Useful when you intentionally want to commit to the
primary without propagating to the target.

```
git commit -m "chore: local-only housekeeping [skip sync]"
```

### Why `--force` does not cause loops

When the primary pushes to the target with `--force`, the target's HEAD is
updated to match the primary's HEAD. If the target then tries to sync back:

1. It reads the primary's HEAD SHA via `ls-remote`.
2. The primary HEAD == target HEAD (they just matched).
3. SHA comparison → skip.
4. No push is made → no new trigger on the primary.

---

## Required Secrets

| Secret name | Scope | Description |
|-------------|-------|-------------|
| `SYNC_PAT` | Repository | A GitHub Personal Access Token (classic or fine-grained) that has **`Contents: Write`** permission on `tkprodesign/mevrelbank`. This token must NOT belong to `github-actions[bot]`. |

### How to create the PAT

1. Go to **github.com → Settings → Developer settings → Personal access tokens**.
2. For a **fine-grained token**: set resource owner to `tkprodesign`, select the `mevrelbank` repository, and grant **Contents: Read and write**.
3. For a **classic token**: select the `repo` scope.
4. Copy the token value.

### How to add the secret to this repository

1. Open **codywoods8899/mevrelbank → Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Name: `SYNC_PAT`, Value: paste the token.
4. Save.

---

## Changing the Target Repository

Edit `.github/sync-config.json`:

```json
{
  "targetOwner": "new-owner",
  "targetRepo":  "new-repo",
  "defaultBranch": "main"
}
```

### How to change the target repository

Update `.github/sync-config.json`:

- `targetOwner`: GitHub owner or organization for the target repository.
- `targetRepo`: Target repository name.
- `defaultBranch`: Fallback branch used when GitHub does not provide a branch name.

No workflow YAML changes should be required for normal target changes.

## Required secrets

The workflow requires the repository secret `SYNC_PAT`.

`SYNC_PAT` must be a GitHub personal access token that can push to the configured target repository. The workflow deliberately does not use `GITHUB_TOKEN` for cross-repository writes.

Minimum expected access:

- Read access to the target repository.
- Write access to the target repository contents.

## Loop prevention

The engine uses several safeguards to prevent synchronization loops:

1. **Actor guard**: the job does not run when `github.actor` is `github-actions[bot]`.
2. **Commit message markers**: commits containing `[skip-sync]` or `[sync skip]` are ignored.
3. **SHA comparison**: the engine compares the source branch `HEAD` SHA against the target branch `HEAD` SHA and exits without pushing when they already match.
4. **Branch-only push**: the engine pushes only `HEAD:refs/heads/<current-branch>`, avoiding tag updates or unrelated branches.
5. **Read-only default token permissions**: the workflow grants `contents: read` to `GITHUB_TOKEN`; cross-repository writes require `SYNC_PAT` explicitly.

These safeguards make the workflow safe to reuse later, including in repositories that may have their own automation.

## How to disable synchronization

Use one of these options:

1. Disable the **GitHub Sync Engine v1** workflow in GitHub Actions.
2. Remove or rename the `SYNC_PAT` secret. Runs will fail before any push can occur.
3. Add `[skip-sync]` or `[sync skip]` to a commit message when a specific commit should not synchronize.
4. Remove the `push` trigger from `.github/workflows/sync-engine.yml` if manual-only operation is desired.

## Logging

Every run logs:

- Source repository.
- Target repository.
- Current branch.
- Current source SHA.
- Target SHA, or that the target branch is missing.
- Whether synchronization occurred.
- The reason synchronization was skipped when no push is needed.

The final summary step runs with `if: always()` so that diagnostics are printed even when an earlier step fails.

## Troubleshooting

### `SYNC_PAT secret is required`

Create a repository secret named `SYNC_PAT`. The token must have permission to read and push to the target repository.

### `sync-config.json must define targetOwner, targetRepo, and defaultBranch`

Verify `.github/sync-config.json` exists and contains all required keys with non-empty string values.

### Target branch does not exist

This is supported. The engine will create the same branch name in the target repository by pushing `HEAD:refs/heads/<current-branch>`.

### Source and target already contain the same HEAD commit

This is a successful no-op. No synchronization is needed.

### Push rejected

Common causes include:

- `SYNC_PAT` does not have write access to the target repository.
- Branch protection rules in the target repository block direct pushes.
- The target branch contains commits that are not ancestors of the source branch.

Resolve the permission, branch protection, or history divergence issue, then rerun the workflow.
No changes to the workflow YAML are required. After updating the JSON:

1. Ensure `SYNC_PAT` has write access to the new target.
2. Commit and push — the next run will sync to the new destination.

---

## Disabling Synchronization

### Temporarily — disable the workflow in the UI

1. Go to **Actions → GitHub Sync Engine v1**.
2. Click the `···` menu → **Disable workflow**.
3. Re-enable the same way when ready.

### Permanently — remove the workflow

Delete `.github/workflows/sync-engine.yml` and commit.

### Per-commit — skip marker

Add `[skip sync]` to any commit message to skip that particular push without
touching the workflow configuration.

### Legacy workflow

This repository also has `.github/workflows/sync-to-tkprodesign.yml`, which
is an older, simpler push workflow. To avoid duplicate sync attempts, disable
or delete that file after enabling `sync-engine.yml`.

---

## Troubleshooting

### Sync not triggering

- Confirm the push was not made by `github-actions[bot]` (check the commit author on GitHub).
- Confirm the commit message does not contain `[skip sync]`.
- Check that the `sync-engine.yml` workflow is **enabled** in the Actions tab.

### `SYNC_PAT` authentication error

```
remote: Permission to tkprodesign/mevrelbank.git denied
```

- Verify the PAT has not expired (fine-grained tokens can have short expiry).
- Verify the PAT has `Contents: Write` on `tkprodesign/mevrelbank`.
- Regenerate the PAT and update the `SYNC_PAT` secret.

### SHA mismatch but push is failing

```
error: failed to push some refs
```

- This usually means the target branch has diverged and `--force` was rejected by a branch protection rule on the target.
- Check **tkprodesign/mevrelbank → Settings → Branches** for protection rules that block force-pushes.
- If protection rules are intentional, consider switching from `--force` to `--force-with-lease` and adding a merge step.

### `jq` command not found

`jq` is pre-installed on all GitHub-hosted `ubuntu-latest` runners. If you
are using a self-hosted runner, install it with:

```bash
sudo apt-get install -y jq
```

### Branch does not exist on target

The first push to a new branch automatically creates it on the target. The
log will show:

```
SHA    : <branch does not exist — will be created>
Decision   : SYNC — push required
```

This is expected behaviour on first-time sync of a new branch.

### Race condition between concurrent runs

If two commits are pushed in rapid succession, two workflow runs start in
parallel. Both read the target SHA before either pushes. Both conclude sync
is needed and both attempt to push. The second push wins because `--force`
is used. The result is correct (target matches the latest source commit) but
the first run's push is redundant. This is acceptable for v1 — v2 could add
a concurrency group:

```yaml
concurrency:
  group: sync-${{ github.ref }}
  cancel-in-progress: true
```

---

*Last updated: 2026-07-10 · Copilot Coding Agent · Session S-11*
