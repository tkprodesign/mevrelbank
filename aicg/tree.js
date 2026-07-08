const github = require('./github');
const config  = require('./config');
const path    = require('path');

/**
 * Return true when a repository path should never be exposed.
 * Checks both directory prefixes and exact filenames.
 *
 * @param {string} itemPath - The path as returned by the GitHub tree API
 */
function isBlocked(itemPath) {
  if (!itemPath) return true;

  // Canonicalize: strip leading slash, collapse backslashes, lowercase.
  // This prevents bypasses like "/.github/..." or "\secrets\...".
  const normalized = itemPath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')   // strip leading slashes
    .toLowerCase();

  const basename = path.basename(normalized);

  // Block by exact filename
  if (config.blockedFilenames.includes(basename)) return true;

  // Block by directory prefix — match '.github' or '.github/anything'
  for (const prefix of config.blockedPrefixes) {
    if (normalized === prefix || normalized.startsWith(prefix + '/')) {
      return true;
    }
  }

  return false;
}

/**
 * Fetch the complete repository tree and strip all blocked paths.
 *
 * @returns {Array<{ path, type, size, sha }>}
 */
async function getFilteredTree() {
  const raw = await github.getTree();

  return raw
    .filter(item => !isBlocked(item.path))
    .map(item => ({
      path: item.path,
      type: item.type === 'blob' ? 'file' : 'tree',
      size: item.size ?? null,
      sha:  item.sha,
    }));
}

module.exports = { getFilteredTree, isBlocked };
