'use strict';

/**
 * Dropbox SDK wrapper.
 * Exposes high-level methods used by the sync system.
 * All paths must be absolute Dropbox paths (start with "/").
 */

const { Dropbox } = require('dropbox');
const fs = require('fs');
const { withRetry } = require('./utils');
const logger = require('./logger');

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB — below Dropbox's 150 MB single-upload limit

let _client = null;

/**
 * Initialize (or return cached) Dropbox client.
 * @param {string} accessToken
 * @returns {Dropbox}
 */
function getClient(accessToken) {
  if (!_client) {
    _client = new Dropbox({ accessToken });
  }
  return _client;
}

/**
 * List all entries recursively under a Dropbox folder.
 * Returns an empty array if the folder does not exist.
 * @param {string} accessToken
 * @param {string} folderPath - Absolute Dropbox path.
 * @returns {Promise<Array<object>>} Array of Dropbox metadata entries.
 */
async function listFolder(accessToken, folderPath) {
  const dbx = getClient(accessToken);
  const entries = [];

  try {
    let res = await withRetry(() =>
      dbx.filesListFolder({ path: folderPath, recursive: true })
    );
    entries.push(...res.result.entries);

    while (res.result.has_more) {
      res = await withRetry(() =>
        dbx.filesListFolderContinue({ cursor: res.result.cursor })
      );
      entries.push(...res.result.entries);
    }
  } catch (err) {
    // Folder does not exist yet — treat as empty
    if (err?.error?.error_summary?.startsWith('path/not_found')) {
      return [];
    }
    throw err;
  }

  return entries;
}

/**
 * Create a Dropbox folder if it does not already exist.
 * @param {string} accessToken
 * @param {string} folderPath
 * @returns {Promise<void>}
 */
async function createFolder(accessToken, folderPath) {
  const dbx = getClient(accessToken);
  try {
    await withRetry(() => dbx.filesCreateFolderV2({ path: folderPath }));
    logger.info(`Created folder: ${folderPath}`);
  } catch (err) {
    // Ignore "already exists" errors
    if (err?.error?.error_summary?.startsWith('path/conflict')) return;
    throw err;
  }
}

/**
 * Ensure a folder path exists, creating each missing ancestor.
 * @param {string} accessToken
 * @param {string} folderPath
 * @returns {Promise<void>}
 */
async function ensureFolder(accessToken, folderPath) {
  try {
    await withRetry(() =>
      getClient(accessToken).filesGetMetadata({ path: folderPath })
    );
  } catch (err) {
    if (err?.error?.error_summary?.startsWith('path/not_found')) {
      // Ensure parent first (recursion)
      const parent = folderPath.substring(0, folderPath.lastIndexOf('/'));
      if (parent && parent !== '') {
        await ensureFolder(accessToken, parent);
      }
      await createFolder(accessToken, folderPath);
    } else {
      throw err;
    }
  }
}

/**
 * Upload a local file to Dropbox, overwriting if it already exists.
 * @param {string} accessToken
 * @param {string} dropboxFilePath - Absolute Dropbox destination path.
 * @param {string} localFilePath   - Absolute local file path.
 * @returns {Promise<void>}
 */
async function uploadFile(accessToken, dropboxFilePath, localFilePath) {
  const dbx = getClient(accessToken);
  const contents = fs.readFileSync(localFilePath);

  await withRetry(() =>
    dbx.filesUpload({
      path: dropboxFilePath,
      contents,
      mode: { '.tag': 'overwrite' },
      autorename: false,
      mute: false,
    })
  );
}

/**
 * Move a file within Dropbox.
 * @param {string} accessToken
 * @param {string} fromPath - Absolute Dropbox source path.
 * @param {string} toPath   - Absolute Dropbox destination path.
 * @returns {Promise<void>}
 */
async function moveFile(accessToken, fromPath, toPath) {
  const dbx = getClient(accessToken);
  await withRetry(() =>
    dbx.filesMoveV2({
      from_path: fromPath,
      to_path: toPath,
      allow_shared_folder: false,
      autorename: false,
      allow_ownership_transfer: false,
    })
  );
}

/**
 * Check whether a Dropbox path exists.
 * @param {string} accessToken
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function fileExists(accessToken, filePath) {
  try {
    await withRetry(() =>
      getClient(accessToken).filesGetMetadata({ path: filePath })
    );
    return true;
  } catch (err) {
    if (err?.error?.error_summary?.startsWith('path/not_found')) return false;
    throw err;
  }
}

/**
 * Fetch Dropbox metadata for a path.
 * @param {string} accessToken
 * @param {string} filePath
 * @returns {Promise<object|null>} Metadata or null if not found.
 */
async function downloadMetadata(accessToken, filePath) {
  try {
    const res = await withRetry(() =>
      getClient(accessToken).filesGetMetadata({ path: filePath })
    );
    return res.result;
  } catch (err) {
    if (err?.error?.error_summary?.startsWith('path/not_found')) return null;
    throw err;
  }
}

module.exports = {
  listFolder,
  createFolder,
  ensureFolder,
  uploadFile,
  moveFile,
  fileExists,
  downloadMetadata,
};

