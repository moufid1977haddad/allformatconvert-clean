// Browser client for the media-processing service.
//
// Flow: ask the site for a one-job ticket (tiny JSON) -> send the file to the
// service IN CHUNKS, DIRECTLY (it never transits a Vercel function) -> start ->
// follow REAL progress -> download the result -> the service deletes it.
//
// Same shape as the market leader's uploader (a job created by an API, then a
// chunked resumable upload straight to the processing node), minus any
// third-party dependency. Every step reports progress, chunks are retried and
// the upload resumes after a network cut.

export const MEDIA_SERVICE_URL = (process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL || '').replace(/\/+$/, '');
export const mediaServiceConfigured = () => MEDIA_SERVICE_URL !== '';

export class MediaJobError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'MediaJobError';
    this.code = code || 'error';
  }
}

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  if (signal) signal.addEventListener('abort', () => { clearTimeout(t); reject(new MediaJobError('Cancelled.', 'cancelled')); }, { once: true });
});

async function api(path, { method = 'GET', ticket, body, signal } = {}) {
  let res;
  try {
    res = await fetch(MEDIA_SERVICE_URL + path, {
      method,
      signal,
      headers: { Authorization: 'Bearer ' + ticket, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new MediaJobError('Cancelled.', 'cancelled');
    throw new MediaJobError('Could not reach the video service. Check your connection and try again.', 'network');
  }
  let json = {};
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}

const hex = (buf) => Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, '0')).join('');

// One chunk via XHR: fetch cannot report upload progress, XHR can.
// The chunk is read into memory and sent as an ArrayBuffer, never as a sliced
// Blob: in a WebKit build, XHR.send(file.slice(a, b)) was measured sending the
// bytes of the FIRST slice for every chunk (the file arrived corrupt). Each
// chunk also carries its SHA-256, which the service verifies.
async function putChunk(url, ticket, blob, onBytes, signal) {
  const data = await blob.arrayBuffer();
  const sha = hex(await crypto.subtle.digest('SHA-256', data));
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Authorization', 'Bearer ' + ticket);
    xhr.setRequestHeader('X-Chunk-Sha256', sha);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onBytes(e.loaded); };
    xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
    xhr.onerror = () => reject(new MediaJobError('Network error during upload.', 'network'));
    xhr.ontimeout = () => reject(new MediaJobError('Upload timed out.', 'network'));
    if (signal) signal.addEventListener('abort', () => { xhr.abort(); reject(new MediaJobError('Cancelled.', 'cancelled')); }, { once: true });
    xhr.send(data);
  });
}

/**
 * @param {{file: File, op: 'convert'|'compress', params: object, onStage: (s: {stage: string, pct?: number, position?: number}) => void, signal?: AbortSignal}} opts
 * @returns {Promise<{blob: Blob, ext: string, bytes: number}>}
 */
export async function runMediaJob({ file, op, params, onStage, signal }) {
  if (!mediaServiceConfigured()) throw new MediaJobError('The video service is not available.', 'not_configured');

  onStage({ stage: 'ticket' });
  let tres;
  try {
    tres = await fetch('/api/media/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op, size: file.size }), signal });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new MediaJobError('Cancelled.', 'cancelled');
    throw new MediaJobError('Could not reach the site. Check your connection and try again.', 'network');
  }
  const tj = await tres.json().catch(() => ({}));
  if (!tres.ok) throw new MediaJobError(tj.message || 'Could not start the conversion.', tj.error || 'ticket');
  const { jid, ticket } = tj;

  const created = await api('/v1/jobs', { method: 'POST', ticket, body: { op, size: file.size, params }, signal });
  if (created.status !== 201) throw new MediaJobError(created.json.message || 'The video service refused this file.', created.json.error);
  const { chunkBytes, totalChunks } = created.json;

  const cleanup = () => { try { fetch(`${MEDIA_SERVICE_URL}/v1/jobs/${jid}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + ticket }, keepalive: true }).catch(() => {}); } catch { /* best effort */ } };
  if (signal) signal.addEventListener('abort', cleanup, { once: true });

  try {
    // ---- upload, chunk by chunk, resumable --------------------------------
    let sentBytes = 0;
    const total = file.size;
    const have = new Set();
    for (let n = 0; n < totalChunks; n++) {
      if (have.has(n)) continue;
      const blob = file.slice(n * chunkBytes, Math.min(total, (n + 1) * chunkBytes));
      let attempt = 0;
      for (;;) {
        try {
          const r = await putChunk(`${MEDIA_SERVICE_URL}/v1/jobs/${jid}/chunks/${n}`, ticket, blob, (loaded) => onStage({ stage: 'upload', pct: Math.min(100, ((sentBytes + loaded) / total) * 100) }), signal);
          if (r.status === 200) break;
          if (r.status === 401 || r.status === 404 || r.status === 409) throw new MediaJobError('The upload session expired. Please start again.', 'expired');
          throw new MediaJobError('Upload failed.', 'network');
        } catch (e) {
          if (e.code === 'cancelled' || e.code === 'expired') throw e;
          attempt++;
          if (attempt >= 4) throw new MediaJobError('The upload keeps failing. Check your connection and try again.', 'network');
          await sleep(800 * attempt, signal);
          // resume: ask which chunks the service really has
          const st = await api(`/v1/jobs/${jid}`, { ticket, signal }).catch(() => null);
          if (st && st.status === 200 && st.json.status === 'uploading' && st.json.receivedChunks > n) { break; }
        }
      }
      sentBytes += blob.size;
      onStage({ stage: 'upload', pct: Math.min(100, (sentBytes / total) * 100) });
    }

    // ---- start (retry while the service is full) --------------------------
    onStage({ stage: 'queued', position: 0 });
    let started = false;
    for (let tries = 0; tries < 200 && !started; tries++) {
      const s = await api(`/v1/jobs/${jid}/start`, { method: 'POST', ticket, signal });
      if (s.status === 202) { started = true; break; }
      if (s.status === 503) { onStage({ stage: 'busy' }); await sleep(3000, signal); continue; }
      if (s.status === 409 && s.json.error === 'incomplete') throw new MediaJobError('The upload was incomplete. Please try again.', 'incomplete');
      throw new MediaJobError(s.json.message || 'The video service could not start this file.', s.json.error);
    }
    if (!started) throw new MediaJobError('The video service is very busy right now. Please try again in a few minutes.', 'busy');

    // ---- follow real progress ---------------------------------------------
    let done = null;
    for (;;) {
      const st = await api(`/v1/jobs/${jid}`, { ticket, signal });
      if (st.status === 401 || st.status === 404) throw new MediaJobError('The conversion session expired. Please try again.', 'expired');
      const j = st.json;
      if (j.status === 'queued') onStage({ stage: 'queued', position: j.queuePosition });
      else if (j.status === 'processing') onStage({ stage: 'processing', pct: j.progress });
      else if (j.status === 'error') throw new MediaJobError(j.error || 'The conversion failed.', j.errorCode);
      else if (j.status === 'done') { done = j; break; }
      await sleep(700, signal);
    }

    // ---- download (the service deletes the file after this) ----------------
    onStage({ stage: 'download', pct: 0 });
    let res;
    try { res = await fetch(`${MEDIA_SERVICE_URL}/v1/jobs/${jid}/result`, { headers: { Authorization: 'Bearer ' + ticket }, signal }); }
    catch (e) { throw new MediaJobError(e && e.name === 'AbortError' ? 'Cancelled.' : 'The download was interrupted. Please try again.', e && e.name === 'AbortError' ? 'cancelled' : 'network'); }
    if (!res.ok) throw new MediaJobError('The result could not be downloaded.', 'download');
    const expected = done.outputBytes || 0;
    const reader = res.body.getReader();
    const parts = [];
    let got = 0;
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      parts.push(value);
      got += value.length;
      if (expected) onStage({ stage: 'download', pct: Math.min(100, (got / expected) * 100) });
    }
    // Never announce success on an empty or truncated file.
    if (got === 0 || (expected && got !== expected)) throw new MediaJobError('The downloaded file is incomplete. Please try again.', 'download');
    const mime = res.headers.get('Content-Type') || 'application/octet-stream';
    return { blob: new Blob(parts, { type: mime }), ext: done.outputExt, bytes: got };
  } catch (e) {
    if (e instanceof MediaJobError && e.code !== 'expired') cleanup();
    throw e;
  }
}
