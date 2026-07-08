'use strict';

/**
 * Upload Engine — uploads new and modified files to Dropbox.
 * Automatically creates missing folder structure.
 * Never duplicates uploads.
 */

const path = require('path');
const dropbox = require('./dropbox');
const logger = require('./logger');

/**
 * Upload a single file to Dropbox, ensuring its parent folder exists first.
 *
 * @param {string} accessToken
 * @param {string} rootFolder    - Absolute Dropbox root (e.g. "/TK Pro Enterprise OS").
 * @param {object} fileEntry     - FileEntry from scanner: { fullPath, relativePath }.
 * @returns {Promise<boolean>} true on success, false on error.
 */
async function uploadOne(accessToken, rootFolder, fileEntry) {
  const destPath = `${rootFolder}/${fileEntry.relativePath}`;
  const destDir = destPath.substring(0, destPath.lastIndexOf('/'));

  try {
    // Create parent folder if needed
    await dropbox.ensureFolder(accessToken, destDir);

    await dropbox.uploadFile(accessToken, destPath, fileEntry.fullPath);
    logger.success(`Uploaded: ${fileEntry.relativePath}`);
    return true;
  } catch (err) {
    logger.error(`Failed to upload ${fileEntry.relativePath}: ${err.message}`);
    return false;
  }
}

/**
 * Upload all new and modified files.
 * Continues on individual failures.
 *
 * @param {string}   accessToken
 * @param {string}   rootFolder
 * @param {object[]} newFiles      - FileEntry[] to upload as new.
 * @param {object[]} modifiedFiles - FileEntry[] to overwrite.
 * @returns {Promise<{ uploaded: number, errors: number }>}
 */
async function uploadAll(accessToken, rootFolder, newFiles, modifiedFiles) {
  let uploaded = 0;
  let errors = 0;

  logger.info(`Uploading ${newFiles.length} new file(s)...`);
  for (const file of newFiles) {
    const ok = await uploadOne(accessToken, rootFolder, file);
    if (ok) uploaded++;
    else errors++;
  }

  logger.info(`Uploading ${modifiedFiles.length} modified file(s)...`);
  for (const file of modifiedFiles) {
    const ok = await uploadOne(accessToken, rootFolder, file);
    if (ok) uploaded++;
    else errors++;
  }

  return { uploaded, errors };
}

module.exports = { uploadAll, uploadOne };

