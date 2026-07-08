require('dotenv').config();

const express = require('express');

const { authorize }                        = require('./auth');
const { validateSession, invalidateSession, getSession } = require('./session');
const { getFilteredTree, isBlocked }       = require('./tree');
const { readAllowed }                      = require('./read');
const { search }                           = require('./search');
const github                               = require('./github');
const { log }                              = require('./logger');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
// Middleware — session guard
// Attach to any route that requires an active session.
// ---------------------------------------------------------------------------

function requireSession(req, res, next) {
  const sessionId = req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(401).json({
      error: 'Unauthorized',
      detail: 'Missing X-Session-ID header',
    });
  }

  const result = validateSession(sessionId);

  if (!result.valid) {
    // All session failures are 401 — the caller must re-authorize.
    return res.status(401).json({
      error:  'Unauthorized',
      detail: result.reason,
    });
  }

  req.sessionId = sessionId;
  next();
}

// ---------------------------------------------------------------------------
// Utility — map common error conditions to HTTP status codes
// ---------------------------------------------------------------------------

function httpStatus(err) {
  if (err.code  && err.code >= 400)  return err.code;
  if (err.status && err.status >= 400) return err.status;
  return 500;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / — service identity
app.get('/', (req, res) => {
  res.json({
    service: 'AI Context Gateway',
    version: '0.1.0',
    status:  'running',
  });
});

// GET /health — liveness probe
app.get('/health', (req, res) => {
  const session = getSession();
  res.json({
    status:        'ok',
    service:       'AI Context Gateway',
    version:       '0.1.0',
    timestamp:     new Date().toISOString(),
    activeSession: session ? true : false,
  });
});

// POST /authorize — exchange the authorization token for a session ID
// Body: { "token": "<SESSION_SECRET value>" }
// Returns: { "sessionId": "<uuid>" }
app.post('/authorize', (req, res) => {
  const start = Date.now();
  const { token } = req.body || {};

  const result = authorize(token);
  const duration = Date.now() - start;

  if (!result.ok) {
    log({ operation: 'authorize', success: false, duration, error: result.reason });
    let status = 401;
    if (result.reason === 'missing_token')    status = 400;
    if (result.serverError)                   status = 503;
    return res.status(status).json({ error: result.reason });
  }

  log({ operation: 'authorize', session: result.sessionId, success: true, duration });
  return res.json({ sessionId: result.sessionId });
});

// POST /invalidate — terminate the active session
// Requires: X-Session-ID header
app.post('/invalidate', requireSession, (req, res) => {
  const start = Date.now();
  invalidateSession();
  log({ operation: 'invalidate', session: req.sessionId, success: true, duration: Date.now() - start });
  return res.json({ invalidated: true });
});

// GET /tree — full repository tree (blocked paths stripped)
// Requires: X-Session-ID header
app.get('/tree', requireSession, async (req, res) => {
  const start = Date.now();
  try {
    const tree = await getFilteredTree();
    log({ operation: 'tree', session: req.sessionId, success: true, duration: Date.now() - start });
    return res.json({ total: tree.length, tree });
  } catch (err) {
    log({ operation: 'tree', session: req.sessionId, success: false, duration: Date.now() - start, error: err.message });
    return res.status(httpStatus(err)).json({ error: err.message });
  }
});

// GET /folder?path=<path> — list folder contents
// path is repository-relative. Omit or pass '' for root.
// Requires: X-Session-ID header
app.get('/folder', requireSession, async (req, res) => {
  const start      = Date.now();
  const folderPath = req.query.path || '';

  if (isBlocked(folderPath) && folderPath !== '') {
    log({ operation: 'folder', session: req.sessionId, resource: folderPath, success: false, duration: Date.now() - start, error: 'blocked' });
    return res.status(403).json({ error: 'Access denied: path is restricted' });
  }

  try {
    const items = await github.listFolder(folderPath);
    // Strip blocked entries from the listing
    const visible = items.filter(item => !isBlocked(item.path));
    log({ operation: 'folder', session: req.sessionId, resource: folderPath || '/', success: true, duration: Date.now() - start });
    return res.json({ path: folderPath || '/', total: visible.length, items: visible });
  } catch (err) {
    log({ operation: 'folder', session: req.sessionId, resource: folderPath, success: false, duration: Date.now() - start, error: err.message });
    return res.status(httpStatus(err)).json({ error: err.message });
  }
});

// GET /file?path=<path> — read and decode a file
// Supports Markdown, plain text, JSON, and all text-based formats.
// Requires: X-Session-ID header
app.get('/file', requireSession, async (req, res) => {
  const start    = Date.now();
  const filePath = req.query.path;

  try {
    const file = await readAllowed(filePath);
    log({ operation: 'file', session: req.sessionId, resource: filePath, success: true, duration: Date.now() - start });
    return res.json(file);
  } catch (err) {
    log({ operation: 'file', session: req.sessionId, resource: filePath, success: false, duration: Date.now() - start, error: err.message });
    return res.status(httpStatus(err)).json({ error: err.message });
  }
});

// GET /search?q=<query>&mode=<filename|code|both>
// mode defaults to 'both'. Filename search is always available;
// code search uses the GitHub Search API (10 req/min rate limit applies).
// Requires: X-Session-ID header
app.get('/search', requireSession, async (req, res) => {
  const start = Date.now();
  const q    = req.query.q;
  const mode = req.query.mode || 'both';

  const VALID_MODES = new Set(['filename', 'code', 'both']);
  if (!VALID_MODES.has(mode)) {
    return res.status(400).json({ error: `Invalid mode "${mode}". Must be one of: filename, code, both` });
  }

  try {
    const results = await search(q, mode);
    log({ operation: 'search', session: req.sessionId, resource: q, success: true, duration: Date.now() - start });
    return res.json(results);
  } catch (err) {
    log({ operation: 'search', session: req.sessionId, resource: q, success: false, duration: Date.now() - start, error: err.message });
    return res.status(httpStatus(err)).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Catch-all 404
// ---------------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  log({ operation: 'unhandled_error', success: false, error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`AI Context Gateway running on port ${PORT}`);
});
