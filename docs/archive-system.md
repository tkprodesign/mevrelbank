# Archive System

## Purpose

The archive system provides a **non-destructive alternative to deletion**. When a file is present in Dropbox but no longer exists in the GitHub repository, it is moved into the archive folder rather than permanently deleted.

## Archive Folder Location

```
<DROPBOX_ROOT_FOLDER>/.github-sync-archive/
```

## Behavior

### What Gets Archived

A file is archived when:

- It exists in the Dropbox sync root, **and**
- It no longer exists anywhere in the GitHub repository.

### What Is Not Archived

- Files already inside `.github-sync-archive/` — the archive folder is excluded from scanning and comparisons entirely.
- Dropbox folders (only files are moved).

## Folder Hierarchy Preservation

The original relative path is preserved inside the archive:

| Original Dropbox path | Archived path |
|---|---|
| `.../components/ui/button.tsx` | `.../.github-sync-archive/components/ui/button.tsx` |
| `.../src/index.ts` | `.../.github-sync-archive/src/index.ts` |

Parent folders are created inside the archive automatically.

## Collision Handling

If an archived file already exists at the destination path:

1. A UTC timestamp suffix is appended **before** the file extension.
2. The format is: `<basename>__<YYYY-MM-DDTHHMMSSZ><ext>`

**Example:**

```
button.tsx  →  button__2026-07-08T200102Z.tsx
```

This means the archive is append-only — no previously archived file is ever overwritten.

## Archive Is Never Cleaned Automatically

The archive grows over time. Manual cleanup or a future scheduled workflow can be used to prune old entries.

## Restoring Files from Archive

To restore a file:

1. Navigate to `<DROPBOX_ROOT_FOLDER>/.github-sync-archive/` in Dropbox.
2. Move the file back to its original location.
3. The next push will detect it as a new upload and sync it normally.

A future `restore` command is planned — see `docs/architecture.md` for extension points.
