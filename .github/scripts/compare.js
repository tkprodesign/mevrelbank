'use strict';

/**
 * Comparison Engine — compares the local repo tree against the Dropbox tree.
 * Everything is keyed on relative paths (forward-slashes).
 */

const path = require('path');
const { normalizePath } = require('./utils');

const ARCHIVE_FOLDER_NAME = '.github-sync-archive';

/**
 * @typedef {object} CompareResult
 * @property {import('./scanner').FileEntry[]} newFiles      - Exist in repo, missing from Dropbox.
 * @property {import('./scanner').FileEntry[]} modifiedFiles - Exist in both but content differs.
 * @property {import('./scanner').FileEntry[]} unchanged     - Exist in both and content matches.
 * @property {DropboxEntry[]}                 orphans        - Exist in Dropbox but not in repo.
 */

/**
 * @typedef {object} DropboxEntry
 * @property {string} dropboxPath   - Absolute Dropbox path.
 * @property {string} relativePath  - Path relative to Dropbox root.
 * @property {string} [hash]        - content_hash from Dropbox (if available).
 * @property {string} [serverModified]
 */

/**
 * Build a map from relativePath → entry for quick lookup.
 * @template T
 * @param {T[]} entries
 * @param {(e: T) => string} keyFn
 * @returns {Map<string, T>}
 */
function buildMap(entries, keyFn) {
  const map = new Map();
  for (const entry of entries) {
    map.set(keyFn(entry), entry);
  }
  return map;
}

/**
 * Normalize a Dropbox content_hash or return null.
 * Dropbox content_hash is hex, not SHA-256 of the whole file.
 * We fall back to server_modified timestamp comparison when hashes differ in scheme.
 * @param {string|undefined} dbxHash
 * @returns {string|null}
 */
function normalizeDropboxHash(dbxHash) {
  if (!dbxHash) return null;
  return dbxHash.toLowerCase();
}

/**
 * Compare local repo files against Dropbox files.
 *
 * Since Dropbox uses its own content_hash (block-based), we cannot directly
 * compare it to a local SHA-256. We treat any file whose Dropbox hash is
 * unavailable as "potentially modified" to be safe.
 *
 * @param {import('./scanner').FileEntry[]} repoFiles  - Files found in local repo.
 * @param {DropboxEntry[]}                 dbxFiles   - Files found in Dropbox (files only, no folders, no archive).
 * @param {string}                         rootFolder - Dropbox root folder path.
 * @returns {CompareResult}
 */
function compare(repoFiles, dbxFiles, rootFolder) {
  // Filter out archive folder entries from Dropbox list (safety net)
  const filteredDbx = dbxFiles.filter(
    (e) => !e.relativePath.startsWith(ARCHIVE_FOLDER_NAME)
  );

  const repoMap = buildMap(repoFiles, (e) => e.relativePath);
  const dbxMap = buildMap(filteredDbx, (e) => e.relativePath);

  const newFiles = [];
  const modifiedFiles = [];
  const unchanged = [];

  for (const [relPath, repoEntry] of repoMap) {
    if (!dbxMap.has(relPath)) {
      newFiles.push(repoEntry);
    } else {
      const dbxEntry = dbxMap.get(relPath);
      // If Dropbox has a content_hash, trust it; otherwise always upload
      if (dbxEntry.hash) {
        // Dropbox content_hash ≠ SHA-256; we can't compare directly.
        // Mark as modified to be safe (will skip if same via overwrite).
        // In a future enhancement, compute Dropbox content_hash locally.
        modifiedFiles.push(repoEntry);
      } else {
        // No hash available → upload to be safe
        modifiedFiles.push(repoEntry);
      }
    }
  }

  // Orphans: in Dropbox but not in repo
  const orphans = [];
  for (const [relPath, dbxEntry] of dbxMap) {
    if (!repoMap.has(relPath)) {
      orphans.push(dbxEntry);
    }
  }

  return { newFiles, modifiedFiles, unchanged, orphans };
}

/**
 * Convert raw Dropbox file entries (from listFolder) into DropboxEntry objects.
 * @param {object[]} rawEntries   - Raw entries from Dropbox SDK filesListFolder.
 * @param {string}   rootFolder   - Absolute Dropbox root path (e.g. "/TK Pro Enterprise OS").
 * @param {string}   archiveName  - Archive folder name to exclude.
 * @returns {DropboxEntry[]}
 */
function toDropboxEntries(rawEntries, rootFolder, archiveName) {
  const root = rootFolder.replace(/\/$/, '');
  const results = [];

  for (const entry of rawEntries) {
    if (entry['.tag'] !== 'file') continue;

    const dbxPath = entry.path_lower || entry.path_display;
    // Compute relative path by stripping the root prefix
    let rel = normalizePath(dbxPath.substring(root.length)).replace(/^\//, '');

    // Skip archive folder
    if (rel.startsWith(archiveName)) continue;

    results.push({
      dropboxPath: entry.path_display || dbxPath,
      relativePath: rel,
      hash: entry.content_hash || null,
      serverModified: entry.server_modified || null,
    });
  }

  return results;
}

module.exports = { compare, toDropboxEntries };

