'use strict';

/**
 * Dropbox Sync — main orchestrator.
 *
 * Flow:
 *   1. Load config & validate secrets
 *   2. Scan local repository
 *   3. Scan Dropbox folder
 *   4. Compare trees
 *   5. Upload new/modified files
 *   6. Archive orphan Dropbox files
 *   7. Print summary
 */

const path = require('path');
const { getConfig } = require('./config');
const logger = require('./logger');
const { scanRepo } = require('./scanner');
const dropboxApi = require('./dropbox');
const { compare, toDropboxEntries } = require('./compare');
const { uploadAll } = require('./upload');
const { archiveOrphans } = require('./archive');

async function main() {
  const startTime = Date.now();
  logger.section('GitHub → Dropbox Sync');
  logger.info('Starting sync...');

  // ── 1. Config ──────────────────────────────────────────────────────────────
  let config;
  try {
    config = getConfig();
    logger.info(`Dropbox root : ${config.rootFolder}`);
    logger.info(`Archive folder: ${config.archiveFolder}`);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }

  const { accessToken, rootFolder, archiveFolder, archiveFolderName } = config;

  // ── 2. Scan local repo ─────────────────────────────────────────────────────
  const repoRoot = process.env.GITHUB_WORKSPACE || process.cwd();
  logger.info(`Scanning repo at: ${repoRoot}`);

  const repoFiles = scanRepo(repoRoot);
  logger.info(`Repo files found: ${repoFiles.length}`);

  // ── 3. Scan Dropbox ────────────────────────────────────────────────────────
  logger.info(`Scanning Dropbox: ${rootFolder}`);
  let rawDbxEntries;
  try {
    rawDbxEntries = await dropboxApi.listFolder(accessToken, rootFolder);
  } catch (err) {
    if (err?.status === 401) {
      logger.error('Dropbox authentication failed. Check DROPBOX_ACCESS_TOKEN.');
      process.exit(1);
    }
    logger.error(`Failed to list Dropbox folder: ${err.message}`);
    process.exit(1);
  }

  const dbxFiles = toDropboxEntries(rawDbxEntries, rootFolder, archiveFolderName);
  logger.info(`Dropbox files found: ${dbxFiles.length}`);

  // ── 4. Compare ─────────────────────────────────────────────────────────────
  logger.section('Comparison');
  const { newFiles, modifiedFiles, unchanged, orphans } = compare(
    repoFiles,
    dbxFiles,
    rootFolder
  );

  logger.info(`New files     : ${newFiles.length}`);
  logger.info(`Modified files: ${modifiedFiles.length}`);
  logger.info(`Unchanged     : ${unchanged.length}`);
  logger.info(`Orphans       : ${orphans.length}`);

  // ── 5. Upload ──────────────────────────────────────────────────────────────
  logger.section('Upload');
  let uploadedCount = 0;
  let uploadErrors = 0;

  if (newFiles.length > 0 || modifiedFiles.length > 0) {
    const result = await uploadAll(accessToken, rootFolder, newFiles, modifiedFiles);
    uploadedCount = result.uploaded;
    uploadErrors = result.errors;
  } else {
    logger.info('No files to upload.');
  }

  // ── 6. Archive orphans ─────────────────────────────────────────────────────
  logger.section('Archive');
  let archivedCount = 0;
  let archiveErrors = 0;

  if (orphans.length > 0) {
    const result = await archiveOrphans(accessToken, archiveFolder, orphans);
    archivedCount = result.archived;
    archiveErrors = result.errors;
  } else {
    logger.info('No orphan files to archive.');
  }

  // ── 7. Summary ─────────────────────────────────────────────────────────────
  const totalErrors = uploadErrors + archiveErrors;

  logger.summary({
    scanned: repoFiles.length,
    dropboxFiles: dbxFiles.length,
    newFiles: newFiles.length,
    updated: modifiedFiles.length,
    archived: archivedCount,
    skipped: unchanged.length,
    errors: totalErrors,
    startTime,
  });

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  const logger2 = require('./logger');
  logger2.error(`Unhandled error: ${err.message}`);
  if (err.stack) logger2.error(err.stack);
  process.exit(1);
});

