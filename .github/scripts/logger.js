'use strict';

/**
 * Logger module — INFO, WARNING, ERROR, SUCCESS levels with timestamps.
 */

const LEVELS = {
  INFO: { label: 'INFO   ', color: '\x1b[36m' },    // cyan
  WARNING: { label: 'WARNING', color: '\x1b[33m' },  // yellow
  ERROR: { label: 'ERROR  ', color: '\x1b[31m' },    // red
  SUCCESS: { label: 'SUCCESS', color: '\x1b[32m' },  // green
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

/** @returns {string} ISO timestamp without milliseconds */
function timestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Log a message at a given level.
 * @param {'INFO'|'WARNING'|'ERROR'|'SUCCESS'} level
 * @param {string} message
 */
function log(level, message) {
  const { label, color } = LEVELS[level] || LEVELS.INFO;
  const ts = timestamp();
  const line = `${color}${BOLD}[${label}]${RESET} ${ts} ${message}`;
  if (level === 'ERROR') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

const logger = {
  info: (msg) => log('INFO', msg),
  warn: (msg) => log('WARNING', msg),
  error: (msg) => log('ERROR', msg),
  success: (msg) => log('SUCCESS', msg),

  /**
   * Print a separator line.
   * @param {string} [title]
   */
  section(title) {
    const line = '─'.repeat(60);
    if (title) {
      console.log(`\n${BOLD}${line}${RESET}`);
      console.log(`${BOLD}  ${title}${RESET}`);
      console.log(`${BOLD}${line}${RESET}`);
    } else {
      console.log(`${BOLD}${line}${RESET}`);
    }
  },

  /**
   * Print the final run summary.
   * @param {object} stats
   * @param {number} stats.scanned     - Files scanned from repo
   * @param {number} stats.dropboxFiles - Files found in Dropbox
   * @param {number} stats.newFiles    - Files uploaded (new)
   * @param {number} stats.updated     - Files uploaded (modified)
   * @param {number} stats.archived    - Files moved to archive
   * @param {number} stats.skipped     - Files skipped (unchanged)
   * @param {number} stats.errors      - Error count
   * @param {number} stats.startTime   - Date.now() at start
   */
  summary(stats) {
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
    logger.section('Sync Summary');
    const pad = (n) => String(n).padStart(5);
    console.log(`  Files Scanned     : ${pad(stats.scanned)}`);
    console.log(`  Dropbox Files     : ${pad(stats.dropboxFiles)}`);
    console.log(`  New Files         : ${pad(stats.newFiles)}`);
    console.log(`  Updated Files     : ${pad(stats.updated)}`);
    console.log(`  Archived Files    : ${pad(stats.archived)}`);
    console.log(`  Skipped Files     : ${pad(stats.skipped)}`);
    console.log(`  Errors            : ${pad(stats.errors)}`);
    console.log(`  Duration          :  ${duration}s`);
    logger.section();

    if (stats.errors > 0) {
      logger.warn(`Run completed with ${stats.errors} error(s).`);
    } else {
      logger.success('Run completed successfully.');
    }
  },
};

module.exports = logger;
