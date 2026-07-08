const crypto = require('crypto');
const config  = require('./config');
const { createSession, invalidateAll } = require('./session');

/**
 * Constant-time string comparison.
 * Prevents timing-based token enumeration.
 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  // timingSafeEqual requires equal-length buffers.
  // To avoid leaking length, we always run the comparison on two
  // same-length buffers; the result is still false when lengths differ.
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Keep runtime constant by doing a dummy comparison
    crypto.timingSafeEqual(Buffer.alloc(1), Buffer.alloc(1));
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validate the supplied token and, on success, create a new session.
 * Any previously active session is unconditionally invalidated first.
 *
 * @param {string} token - The authorization token supplied by the caller.
 * @returns {{ ok: boolean, sessionId?: string, reason?: string }}
 */
function authorize(token) {
  if (!token) {
    return { ok: false, reason: 'missing_token' };
  }

  if (!config.auth.secret) {
    // Server is not configured — fail closed with a server-error signal
    return { ok: false, reason: 'server_misconfigured', serverError: true };
  }

  if (!safeEqual(token, config.auth.secret)) {
    return { ok: false, reason: 'invalid_token' };
  }

  // Token is valid — replace any existing session with a fresh one
  invalidateAll();
  const sessionId = createSession();

  return { ok: true, sessionId };
}

module.exports = { authorize };
