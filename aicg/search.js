const github = require('./github');
const { isBlocked } = require('./tree');

/**
 * Search the repository by filename and/or code content.
 *
 * Mode options:
 *   'filename' - fast tree walk, no API quota cost beyond tree fetch
 *   'code'     - GitHub Search API (10 req/min rate limit)
 *   'both'     - run both, deduplicate, rank with filename matches first
 *
 * @param {string} query
 * @param {'filename'|'code'|'both'} mode
 * @returns {Promise<{ query, total, results: Array }>}
 */
async function search(query, mode = 'both') {
  if (!query || !query.trim()) {
    const err = new Error('Query parameter "q" is required');
    err.code = 400;
    throw err;
  }

  const filenameResults = [];
  const codeResults     = [];
  let   codeError       = null;

  // --- Filename search (always fast, no extra quota) ---
  if (mode === 'filename' || mode === 'both') {
    const matches = await github.searchFilenames(query);
    filenameResults.push(
      ...matches
        .filter(m => !isBlocked(m.path))
        .map(m => ({ ...m, matchType: 'filename' }))
    );
  }

  // --- Code search via GitHub Search API ---
  if (mode === 'code' || mode === 'both') {
    try {
      const matches = await github.searchCode(query);
      codeResults.push(
        ...matches
          .filter(m => !isBlocked(m.path))
          .map(m => ({ ...m, matchType: 'code' }))
      );
    } catch (err) {
      // GitHub code search can fail due to rate limits or repository not being indexed.
      // Degrade gracefully — return filename results and surface the error.
      codeError = err.message;
    }
  }

  // --- Merge and rank ---
  // Filename matches (exact path hits) rank above code matches.
  const seen    = new Set();
  const ranked  = [];

  for (const r of filenameResults) {
    if (!seen.has(r.path)) { seen.add(r.path); ranked.push(r); }
  }
  for (const r of codeResults) {
    if (!seen.has(r.path)) { seen.add(r.path); ranked.push(r); }
  }

  const response = { query, total: ranked.length, results: ranked };

  // Surface code search degradation transparently
  if (codeError) response.codeSearchUnavailable = codeError;

  return response;
}

module.exports = { search };
