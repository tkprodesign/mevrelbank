'use strict';

/**
 * Repository Scanner — recursively walks the local repo.
 * Returns file metadata including hash for change detection.
 */

const fs = require('fs');
const path = require('path');
const { computeHash, normalizePath } = require('./utils');

/** Patterns always excluded from scanning. */
const DEFAULT_IGNORE = new Set(['.git', '.github-sync-archive', 'node_modules']);

/**
 * Add extra ignore patterns at runtime (for future extension).
 * @param {string[]} patterns
 */
const extraIgnore = new Set();
function addIgnorePattern(pattern) {
  extraIgnore.add(pattern);
}

/**
 * @typedef {object} FileEntry
 * @property {string} fullPath     - Absolute path on disk.
 * @property {string} relativePath - Path relative to repoRoot, forward-slashes.
 * @property {number} size         - File size in bytes.
 * @property {Date}   mtime        - Last-modified time.
 * @property {string} hash         - SHA-256 of file contents.
 */

/**
 * Recursively scan a directory and return all file entries.
 * @param {string} repoRoot - Absolute path to repository root.
 * @returns {FileEntry[]}
 */
function scanRepo(repoRoot) {
  const results = [];
  walk(repoRoot, repoRoot, results);
  return results;
}

/**
 * Internal recursive walker.
 * @param {string} repoRoot
 * @param {string} currentDir
 * @param {FileEntry[]} results
 */
function walk(repoRoot, currentDir, results) {
  let entries;
  try {
    entries = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch (err) {
    // Permission errors etc. — skip directory
    return;
  }

  for (const entry of entries) {
    const name = entry.name;

    // Skip ignored names
    if (DEFAULT_IGNORE.has(name) || extraIgnore.has(name)) continue;

    const fullPath = path.join(currentDir, name);
    const relativePath = normalizePath(path.relative(repoRoot, fullPath));

    if (entry.isDirectory()) {
      walk(repoRoot, fullPath, results);
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(fullPath);
        const hash = computeHash(fullPath);
        results.push({
          fullPath,
          relativePath,
          size: stat.size,
          mtime: stat.mtime,
          hash,
        });
      } catch (err) {
        // Unreadable file — skip
      }
    }
  }
}

module.exports = { scanRepo, addIgnorePattern };
