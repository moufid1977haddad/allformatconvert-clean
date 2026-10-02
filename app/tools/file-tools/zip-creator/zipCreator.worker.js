import { MAX_TOTAL_SIZE_BYTES } from './config';

class LimitExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LimitExceededError';
  }
}

async function run({ files, maxTotalBytes, compressionLevel, password }) {
  const limit = maxTotalBytes || MAX_TOTAL_SIZE_BYTES;
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > limit) {
    throw new LimitExceededError(`These files add up to more than ${(limit / (1024 * 1024)).toFixed(0)} MB combined.`);
  }

  const level = Number.isInteger(compressionLevel) ? compressionLevel : 6;

  // P24 (03/10): a password-protected ZIP, as ezyZip and 7-Zip make it — AES-256 (WinZip AE-2), which 7-Zip, WinRAR,
  // macOS Archive Utility (via The Unarchiver), Windows 11 Explorer and bsdtar open; never the old ZipCrypto, which is
  // broken. zip.js writes it; JSZip, kept for unprotected archives, cannot encrypt.
  if (password) {
    const { ZipWriter, BlobWriter, BlobReader, configure } = await import('@zip.js/zip.js');
    configure({ useWebWorkers: false }); // already in a worker
    const writer = new ZipWriter(new BlobWriter('application/zip'), { password, encryptionStrength: 3, zipCrypto: false, level, bufferedWrite: true });
    let done = 0;
    for (const file of files) {
      await writer.add(file.name, new BlobReader(file), {
        onprogress: (p) => { self.postMessage({ type: 'progress', pct: Math.round(((done + p / Math.max(1, file.size)) / totalBytes || 0) * 100), phase: 'zipping' }); },
      });
      done += file.size;
    }
    const blob = await writer.close();
    self.postMessage({ type: 'done', blob, fileCount: files.length, encrypted: true });
    return;
  }

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  // Pass each Blob straight to JSZip instead of pre-reading it with
  // file.arrayBuffer() -- JSZip reads a Blob's bytes lazily when it
  // actually compresses that entry during generateAsync, instead of every
  // file's raw bytes being resident in memory at once before zipping
  // starts.
  for (const file of files) {
    zip.file(file.name, file);
  }

  const genOptions = level === 0
    ? { type: 'blob', compression: 'STORE' }
    : { type: 'blob', compression: 'DEFLATE', compressionOptions: { level } };

  const blob = await zip.generateAsync(genOptions, (metadata) => {
    self.postMessage({ type: 'progress', pct: Math.round(metadata.percent), phase: 'zipping' });
  });
  self.postMessage({ type: 'done', blob, fileCount: files.length });
}

self.onmessage = (e) => {
  run(e.data).catch((err) => {
    if (err instanceof LimitExceededError) {
      self.postMessage({ type: 'limit', message: err.message });
    } else {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    }
  });
};
