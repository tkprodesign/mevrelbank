const path   = require('path');
const github = require('./github');
const { isBlocked } = require('./tree');

/**
 * File extensions that are known to be binary (non-text).
 * These cannot be meaningfully decoded to UTF-8 and are not returned.
 */
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tiff',
  '.pdf', '.zip', '.tar', '.gz', '.bz2', '.rar', '.7z',
  '.exe', '.bin', '.dll', '.so', '.dylib',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.wav', '.ogg', '.flac', '.avi', '.mov', '.mkv',
  '.psd', '.ai', '.sketch', '.fig',
  '.db', '.sqlite',
]);

/**
 * Return true when the file at this path can be read and decoded as text.
 *
 * @param {string} filePath
 */
function isReadable(filePath) {
  if (!filePath) return false;
  if (isBlocked(filePath)) return false;

  const ext = path.extname(filePath).toLowerCase();

  // Files with no extension (Makefile, LICENSE, Dockerfile, etc.) are text
  if (!ext) return true;

  // Block known binary types
  if (BINARY_EXTENSIONS.has(ext)) return false;

  return true;
}

/**
 * Read a file from the repository, with access and type checks.
 * Supports: Markdown, plain text, JSON, and any other text-based format.
 *
 * @param {string} filePath - Repository-relative path
 * @returns {Promise<{ path, name, size, sha, content, encoding }>}
 * @throws Error with .code set to the appropriate HTTP status
 */
async function readAllowed(filePath) {
  if (!filePath) {
    const err = new Error('Query parameter "path" is required');
    err.code = 400;
    throw err;
  }

  if (isBlocked(filePath)) {
    const err = new Error('Access denied: path is restricted');
    err.code = 403;
    throw err;
  }

  if (!isReadable(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const err = new Error(`Binary file type not supported: ${ext}`);
    err.code = 415; // Unsupported Media Type
    throw err;
  }

  return github.readFile(filePath);
}

module.exports = { readAllowed, isReadable };
