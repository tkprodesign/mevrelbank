const { Octokit } = require('@octokit/rest');
const config = require('./config');

// Single shared Octokit instance
const octokit = new Octokit({ auth: config.github.token });

const { owner, repo } = config.github;

/**
 * Fetch top-level repository metadata.
 * Returns a trimmed object — no credentials, no admin fields.
 */
async function getRepoMeta() {
  const { data } = await octokit.repos.get({ owner, repo });
  return {
    name:          data.name,
    owner:         data.owner.login,
    description:   data.description,
    defaultBranch: data.default_branch,
    private:       data.private,
    size:          data.size,
    updatedAt:     data.updated_at,
    language:      data.language,
    topics:        data.topics,
  };
}

/**
 * Fetch the full recursive tree for a branch/commit ref.
 * Defaults to the repository's default branch.
 *
 * @param {string|null} branch - Branch name or commit SHA. Null → default branch.
 * @returns {Array<{ path, type, sha, size }>}
 */
async function getTree(branch = null) {
  let ref = branch;
  if (!ref) {
    const meta = await getRepoMeta();
    ref = meta.defaultBranch;
  }

  const { data } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: ref,
    recursive: '1',
  });

  return data.tree; // [{ path, mode, type, sha, size, url }]
}

/**
 * List the direct contents of a folder (non-recursive).
 * Pass an empty string or omit to list the root.
 *
 * @param {string} folderPath
 * @returns {Array<{ name, path, type, size, sha }>}
 */
async function listFolder(folderPath) {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: folderPath || '',
  });

  if (!Array.isArray(data)) {
    const err = new Error('Path is a file, not a directory');
    err.status = 400;
    throw err;
  }

  return data.map(item => ({
    name: item.name,
    path: item.path,
    type: item.type,   // 'file' | 'dir' | 'symlink' | 'submodule'
    size: item.size ?? null,
    sha:  item.sha,
  }));
}

/**
 * Read and decode a single file's content.
 * GitHub returns base64-encoded content; we decode it to UTF-8.
 *
 * @param {string} filePath
 * @returns {{ path, name, size, sha, content, encoding }}
 */
async function readFile(filePath) {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: filePath,
  });

  if (Array.isArray(data)) {
    const err = new Error('Path is a directory, not a file');
    err.status = 400;
    throw err;
  }

  // GitHub always returns file content as base64
  const content = data.encoding === 'base64'
    ? Buffer.from(data.content, 'base64').toString('utf8')
    : data.content;

  return {
    path:     data.path,
    name:     data.name,
    size:     data.size,
    sha:      data.sha,
    content,
    encoding: 'utf8',
  };
}

/**
 * Search repository code via the GitHub Search API.
 * Note: GitHub Search has a rate limit of 10 req/min for authenticated requests.
 *
 * @param {string} query - Search keywords
 * @returns {Array<{ path, name, sha, score, htmlUrl }>}
 */
async function searchCode(query) {
  const q = `${query} repo:${owner}/${repo}`;
  const { data } = await octokit.search.code({ q, per_page: 30 });

  return data.items.map(item => ({
    path:    item.path,
    name:    item.name,
    sha:     item.sha,
    score:   item.score,
    htmlUrl: item.html_url,
  }));
}

/**
 * Fast local filename search — filters the full tree by path substring.
 * No API quota cost beyond the initial tree fetch.
 *
 * @param {string} query - Substring to match against file paths
 * @returns {Array<{ path, sha, size }>}
 */
async function searchFilenames(query) {
  const tree = await getTree();
  const q = query.toLowerCase();

  return tree
    .filter(item => item.type === 'blob' && item.path.toLowerCase().includes(q))
    .map(item => ({ path: item.path, sha: item.sha, size: item.size ?? null }));
}

module.exports = { getRepoMeta, getTree, listFolder, readFile, searchCode, searchFilenames };
