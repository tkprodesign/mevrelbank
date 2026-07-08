const fs   = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');

// Ensure logs directory exists at startup
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Write a structured log entry.
 *
 * @param {object} opts
 * @param {string}  opts.operation   - Name of the operation (e.g. 'authorize', 'file')
 * @param {string}  [opts.session]   - Session ID (omit before auth)
 * @param {string}  [opts.resource]  - Path or query being accessed
 * @param {number}  [opts.duration]  - Elapsed milliseconds
 * @param {boolean} opts.success     - Whether the operation succeeded
 * @param {string}  [opts.error]     - Error message on failure
 */
function log({ operation, session = null, resource = null, duration = null, success, error = null }) {
  const entry = {
    timestamp: new Date().toISOString(),
    operation,
    session,
    resource,
    duration,
    success,
  };

  // Only include error field when it exists (keeps success logs clean)
  if (error) entry.error = error;

  const line = JSON.stringify(entry);

  // Console output for workflow logs
  console.log(line);

  // Append to daily rolling log file
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const file = path.join(logDir, `aicg-${date}.log`);
  try {
    fs.appendFileSync(file, line + '\n');
  } catch (_) {
    // Never let logging crash the server
  }
}

module.exports = { log };
