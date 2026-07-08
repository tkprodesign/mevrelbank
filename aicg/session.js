const { v4: uuidv4 } = require('uuid');
const config = require('./config');

/**
 * Single active session — stored entirely in process memory.
 * Shape: { id, createdAt, lastActivity, expiresAt }  — or null when none exists.
 */
let activeSession = null;

/**
 * Create a new session and return its ID.
 * Any previous session is replaced; call invalidateAll() first if you need the
 * old one gone before creating the new one.
 */
function createSession() {
  const now = Date.now();
  activeSession = {
    id:           uuidv4(),
    createdAt:    now,
    lastActivity: now,
    expiresAt:    now + config.session.ttlMs,
  };
  return activeSession.id;
}

/** Return the current raw session object (may be null). */
function getSession() {
  return activeSession;
}

/**
 * Check whether a session ID is valid.
 * Updates lastActivity on success.
 *
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateSession(sessionId) {
  if (!activeSession) {
    return { valid: false, reason: 'no_active_session' };
  }
  if (activeSession.id !== sessionId) {
    return { valid: false, reason: 'invalid_session_id' };
  }
  if (Date.now() > activeSession.expiresAt) {
    activeSession = null;
    return { valid: false, reason: 'session_expired' };
  }
  // Refresh last-activity timestamp
  activeSession.lastActivity = Date.now();
  return { valid: true };
}

/** Terminate the current active session immediately. */
function invalidateSession() {
  activeSession = null;
}

/** Alias — invalidates the one and only possible session. */
function invalidateAll() {
  activeSession = null;
}

module.exports = { createSession, getSession, validateSession, invalidateSession, invalidateAll };
