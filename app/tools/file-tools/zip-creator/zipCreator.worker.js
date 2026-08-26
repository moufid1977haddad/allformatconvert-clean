import { MAX_TOTAL_SIZE_BYTES } from './config';

class LimitExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LimitExceededError';
  }
}

async function run({ files, maxTotalBytes }) {
  const limit = maxTotalBytes || MAX_TOTAL_SIZE_BYTES;
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > limit) {
    throw new LimitExceededError(`These files add up to more than ${(limit / (1024 * 1024)).toFixed(0)} MB combined.`);
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

  const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
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
