# Copilot Agent Instructions — MevrelBank

These instructions apply to every GitHub Copilot agent (Coding Agent, Code Review, CLI, etc.) working in this repository. Read them before making any changes.

---

## 1. Documentation update requirement

**Every agent session that modifies code, config, or content must update the documentation before completing.**

### Files that must be kept current

| File | Update when |
|------|-------------|
| `docs/session-log.md` | Every agent session — append a new entry (see format below) |
| `mevrelbank/roadmap.md` | A phase item is completed, a decision changes, or a new phase item is added |
| `replit.md` | Project phase, status, or hosting changes |
| The relevant `README.md` | A new feature, API endpoint, or integration is added to the module the README covers |

---

## 2. Session log entry format

Append a new entry at the **top** of the `## Session Index` table and add the full entry block immediately after the index, before all prior entries.

### Index row

```markdown
| [S-NN](#s-nn) | YYYY-MM-DDTHH:MMZ | [#PR](url) or — | Short title | Agent Name |
```

- `S-NN` — increment from the highest existing session number.
- Date — UTC timestamp at the start of the session (`YYYY-MM-DDTHH:MMZ`).
- PR — link to the PR if one was created; `—` if not.
- Agent Name — use your exact agent name (e.g. `Copilot Coding Agent`, `Copilot Code Review`, `Copilot CLI`).

### Entry block

```markdown
<a id="s-nn"></a>
## S-NN · YYYY-MM-DDTHH:MMZ · Short title

**Agent:** <Your agent name here>  
**Branch:** `branch-name`  
**PR:** [#N](url) or (current) or —  
**Trigger:** One sentence describing what the user asked for.

### Objective
One to three sentences describing the goal of the session.

### Files Changed
| File | Status | +Lines | −Lines | Notes |
|------|--------|--------|--------|-------|
| `path/to/file.ts` | added/modified/removed | N | N | What changed and why |

### Outcome
One to three sentences describing the result and what remains to be done.

---
```

---

## 3. Roadmap update rules

- Check off `- [x]` items when the corresponding code is merged.
- Add new `- [ ]` items if a new feature or phase item is introduced.
- Update the `# Decisions Log` section if a technology choice changes (e.g. database, auth strategy, hosting).

---

## 4. replit.md update rules

`replit.md` describes the current state of the repository to developers opening it in Replit.

- Update the status bullets when a phase changes.
- Update the hosting table when a new service is provisioned or a decision is revised.
- Do **not** describe planned items as active; mark them clearly as `(planned)`.

---

## 5. README update rules

When adding a new integration, API endpoint, or significant behaviour change to a module:

- Update the `README.md` in that module's root directory.
- Add a dated entry at the bottom of the README under a `## Changelog` heading if one exists, or create one if it does not.
- The changelog entry format is: `### YYYY-MM-DD — Agent Name — Short description`

---

## 6. Format guidance

- Use UTC for all timestamps.
- Agent name is the literal name that identifies you (not a generic noun). When in doubt, use `Copilot Coding Agent`.
- Keep session log entries factual and file-precise. Avoid vague descriptions like "various updates".
- Line counts in the file table should be approximate (`~120`) when exact counts are unavailable.
