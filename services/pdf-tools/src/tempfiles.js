const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PREFIX = 'pdftools-req-';
const STALE_MS = 60 * 60 * 1000; // 1 hour

function makeRequestDir() {
  const dir = path.join(os.tmpdir(), PREFIX + crypto.randomUUID());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupDir(dir) {
  if (!dir) return;
  fs.rm(dir, { recursive: true, force: true }, (err) => {
    if (err) console.error('Failed to clean up temp dir:', err.message);
  });
}

// Defense in depth: if a previous request's process was killed (crash, OOM,
// a timeout path that didn't run to completion) before its cleanupDir call
// fired, this sweeps anything left behind on the next startup. Files are
// never meant to persist even that long, so this is a safety net, not the
// primary cleanup mechanism.
function sweepStaleTempDirs() {
  const tmp = os.tmpdir();
  let entries;
  try {
    entries = fs.readdirSync(tmp);
  } catch {
    return;
  }
  const now = Date.now();
  for (const name of entries) {
    if (!name.startsWith(PREFIX)) continue;
    const full = path.join(tmp, name);
    try {
      const stat = fs.statSync(full);
      if (now - stat.mtimeMs > STALE_MS) {
        fs.rmSync(full, { recursive: true, force: true });
      }
    } catch {
      // Already gone, or a permissions race -- not worth failing startup over.
    }
  }
}

module.exports = { makeRequestDir, cleanupDir, sweepStaleTempDirs };
