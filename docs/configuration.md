# Configuration

## Required GitHub Secrets

Both secrets must be set in **Settings → Secrets and variables → Actions**.

| Secret | Description | Example |
|---|---|---|
| `DROPBOX_ACCESS_TOKEN` | Long-lived Dropbox access token | `sl.B.AbcXyz...` |
| `DROPBOX_ROOT_FOLDER` | Dropbox folder that receives all synced files | `TK Pro Enterprise OS` |

### DROPBOX_ACCESS_TOKEN

Generate from the [Dropbox App Console](https://www.dropbox.com/developers/apps):

1. Create or open your App.
2. Go to **Settings → OAuth 2**.
3. Click **Generate** under *Generated access token*.
4. Copy the token and paste it into the GitHub secret.

> **Note:** Dropbox short-lived tokens expire after 4 hours. For production use, generate a long-lived offline token or implement token refresh.

### DROPBOX_ROOT_FOLDER

The name of the Dropbox folder that will act as the sync root.

- Leading or trailing slashes are accepted — the system normalizes them.
- The folder does **not** need to exist in advance; `ensureFolder()` creates it.
- The value is case-sensitive on Dropbox.

**Examples:**

```
TK Pro Enterprise OS
/TK Pro Enterprise OS
```

Both resolve to `/TK Pro Enterprise OS` internally.

## Archive Folder

The archive folder is automatically created inside the root:

```
<DROPBOX_ROOT_FOLDER>/.github-sync-archive/
```

It is never scanned or synced — only used to store removed files.

## Adding Optional Configuration (Future)

To add new config keys, edit `.github/scripts/config.js`:

```js
const myValue = process.env.MY_NEW_SECRET || 'default-value';
```

Add the corresponding secret to `.github/workflows/dropbox-sync.yml` under the `env:` block of the sync step.

## Local Testing

To run the sync locally, export the required environment variables:

```bash
export DROPBOX_ACCESS_TOKEN="your-token"
export DROPBOX_ROOT_FOLDER="TK Pro Enterprise OS"
npm ci
node .github/scripts/dropbox-sync.js
```
