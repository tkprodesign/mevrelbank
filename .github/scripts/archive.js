'use strict';

/**
 * Archive Engine — moves orphan Dropbox files into the archive folder.
 * Never deletes; preserves directory hierarchy; handles filename collisions.
 */

const path = require('path');
const { utcTimestamp, stampedFilename } = require('./utils');
const dropbox = require('./dropbox');
const logger = require('./logger');

/**
 * Archive a single orphan Dropbox file.
 * Destination: <archiveFolder>/<relativePath>
 * On collision: rename with UTC timestamp before extension.
 *
 * @param {string} accessToken
 * @param {string} archiveFolder  - Absolute Dropbox archive path.
 * @param {object} orphan         - DropboxEntry object with .dropboxPath and .relativePath.
 * @returns {Promise<boolean>} true on success, false on error.
 */
async function archiveFile(accessToken, archiveFolder, orphan) {
  const destPath = `${archiveFolder}/${orphan.relativePath}`;

  try {
    // Ensure the destination folder exists
    const destDir = destPath.substring(0, destPath.lastIndexOf('/'));
    await dropbox.ensureFolder(accessToken, destDir);

    // Check for collision
    const exists = await dropbox.fileExists(accessToken, destPath);
    let finalDest = destPath;

    if (exists) {
      const ts = utcTimestamp();
      const dir = destPath.substring(0, destPath.lastIndexOf('/'));
      const filename = path.basename(destPath);
      const newFilename = stampedFilename(filename, ts);
      finalDest = `${dir}/${newFilename}`;
      logger.warn(
        `Archive collision for ${orphan.relativePath} → renaming to ${newFilename}`
      );
    }

    await dropbox.moveFile(accessToken, orphan.dropboxPath, finalDest);
    logger.success(`Archived: ${orphan.relativePath} → ${finalDest}`);
    return true;
  } catch (err) {
    logger.error(`Failed to archive ${orphan.relativePath}: ${err.message}`);
    return false;
  }
}

/**
 * Archive all orphan Dropbox files.
 * Continues on individual failures.
 *
 * @param {string}   accessToken
 * @param {string}   archiveFolder - Absolute Dropbox archive folder path.
 * @param {object[]} orphans       - Array of DropboxEntry objects.
 * @returns {Promise<{ archived: number, errors: number }>}
 */
async function archiveOrphans(accessToken, archiveFolder, orphans) {
  let archived = 0;
  let errors = 0;

  for (const orphan of orphans) {
    const ok = await archiveFile(accessToken, archiveFolder, orphan);
    if (ok) archived++;
    else errors++;
  }

  return { archived, errors };
}

module.exports = { archiveOrphans, archiveFile };

