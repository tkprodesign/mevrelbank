'use strict';

/**
 * Config module — reads and validates required environment variables.
 * Exports a single frozen configuration object.
 */

const ARCHIVE_FOLDER = '.github-sync-archive';

/**
 * Read a required environment variable.
 * @param {string} name
 * @returns {string}
 */
function requireEnv(name) {
  const val = process.env[name];
  if (!val || val.trim() === '') {
    throw new Error(
      `[config] Missing required secret: ${name}\n` +
        `  → Add it to your repository secrets under Settings → Secrets → Actions.`
    );
  }
  return val.trim();
}

let _config = null;

/**
 * Return the validated configuration object (cached after first call).
 * @returns {{ accessToken: string, rootFolder: string, archiveFolder: string }}
 */
function getConfig() {
  if (_config) return _config;

  const accessToken = requireEnv('DROPBOX_ACCESS_TOKEN');
  const rawRoot = requireEnv('DROPBOX_ROOT_FOLDER');

  // Ensure root starts with "/" and has no trailing slash
  const rootFolder = '/' + rawRoot.replace(/^\/+/, '').replace(/\/+$/, '');

  if (rootFolder === '/') {
    throw new Error(
      '[config] DROPBOX_ROOT_FOLDER must not be the root "/" — ' +
        'specify a folder name such as "/TK Pro Enterprise OS".'
    );
  }

  _config = Object.freeze({
    accessToken,
    rootFolder,
    archiveFolder: `${rootFolder}/${ARCHIVE_FOLDER}`,
    archiveFolderName: ARCHIVE_FOLDER,
  });

  return _config;
}

module.exports = { getConfig };

