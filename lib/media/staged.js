// Server side of the "staged" document path (Office / HTML / PDF files larger than the ~4.5 MB Vercel
// request-body ceiling).
//
//   browser --chunks--> media-processing service (job op "stage", signed one-job ticket)
//   browser --tiny JSON {jid, ticket, filename}--> the tool's API route (this file's helpers)
//   route   --server ticket--> service: GET source   (file read server-to-server)
//   route   converts exactly as before (guard, ConvertAPI / Gotenberg, checks)
//   route   --server ticket--> service: PUT output   (length + SHA-256 + magic bytes verified there)
//   browser <-- downloads the result from the service (deleted after one complete download)
//
// Nothing here has a default value: a missing variable answers 503 with the variable NAMES.
const { createHash } = require('node:crypto');
const { mintTicket, verifyTicket } = require('./ticket');

// Which extension a converted result is stored under, and its magic (the service re-checks it).
const OUTPUT_EXT = { pdf: 'pdf', docx: 'docx' };

function stagedConfig(env = process.env) {
  const missing = [];
  const secret = env.MEDIA_TICKET_SECRET;
  if (!secret) missing.push('MEDIA_TICKET_SECRET');
  const base = (env.NEXT_PUBLIC_MEDIA_SERVICE_URL || '').replace(/\/+$/, '');
  if (!base) missing.push('NEXT_PUBLIC_MEDIA_SERVICE_URL');
  return missing.length ? { ok: false, missing } : { ok: true, secret, base };
}

/**
 * Validates what the browser sent for a staged conversion and returns a handle.
 * @returns {{ok:true, jid:string, filename:string, serverTicket:string, base:string}|{ok:false, status:number, error:string}}
 */
function openStaged(body, env = process.env) {
  const cfg = stagedConfig(env);
  if (!cfg.ok) {
    console.error('[staged] not configured, missing:', cfg.missing.join(', '));
    return { ok: false, status: 503, error: 'Large-file conversion is not available right now.' };
  }
  const p = verifyTicket(body && body.ticket, cfg.secret);
  if (!p || p.op !== 'stage' || p.role !== 'browser' || !body.jid || p.jid !== body.jid) {
    return { ok: false, status: 401, error: 'This upload session is not valid or has expired. Please start again.' };
  }
  const filename = typeof body.filename === 'string' ? body.filename.slice(0, 255) : '';
  const t = mintTicket({ secret: cfg.secret, op: 'stage', maxBytes: p.max, jid: p.jid, role: 'server' });
  return { ok: true, jid: p.jid, filename, serverTicket: t.ticket, base: cfg.base };
}

async function readSource(h) {
  let res;
  try {
    res = await fetch(`${h.base}/v1/jobs/${h.jid}/source`, { headers: { Authorization: 'Bearer ' + h.serverTicket }, cache: 'no-store' });
  } catch {
    return { ok: false, status: 502, error: 'Could not read your uploaded file. Please try again.' };
  }
  if (!res.ok) {
    return { ok: false, status: res.status === 404 || res.status === 409 ? 410 : 502, error: 'Your uploaded file is no longer available. Please upload it again.' };
  }
  // A Blob, not a Buffer: the route wraps it in a File without copying it, which keeps the memory of the
  // function (the binding ceiling, see docs/audit/RAPPORT-office-envoi-morceaux.md) as low as possible.
  const blob = await res.blob();
  const expected = Number(res.headers.get('content-length') || 0);
  if (blob.size === 0 || (expected && blob.size !== expected)) {
    return { ok: false, status: 502, error: 'Your uploaded file arrived incomplete. Please try again.' };
  }
  return { ok: true, blob };
}

/** Deposits the converted bytes; returns {ok, outputBytes} or {ok:false,...}. */
async function depositOutput(h, bytes, ext) {
  if (!OUTPUT_EXT[ext]) return { ok: false, status: 500, error: 'Unsupported output type.' };
  // A view on the same memory, never a copy: the converted file can be hundreds of MB.
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sha = createHash('sha256').update(buf).digest('hex');
  let res;
  try {
    res = await fetch(`${h.base}/v1/jobs/${h.jid}/output`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + h.serverTicket, 'X-Output-Ext': ext, 'X-Output-Sha256': sha, 'Content-Type': 'application/octet-stream', 'Content-Length': String(buf.length) },
      body: buf,
    });
  } catch {
    return { ok: false, status: 502, error: 'The converted file could not be stored for download. Please try again.' };
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: 502, error: 'The converted file could not be stored for download. Please try again.' };
  return { ok: true, outputBytes: j.outputBytes };
}

/**
 * Keeps the staged job alive while the converter works.
 *
 * MEASURED 2026-09-22 (docs/audit/RAPPORT-plafonds-mesures.md): a 69.8 MB workbook took LibreOffice ~3.5 min,
 * during which the media service received no request at all; Railway's Serverless sleep stopped the container,
 * and since the job registry is IN MEMORY, the restart lost the job -- the finished PDF was then refused with
 * a 404 on deposit and the visitor saw a failure after a successful conversion. One cheap request per minute
 * keeps the container awake, and it is the same request the browser polls with, so nothing new is exposed.
 * Returns a function that stops it; always call it in a finally.
 */
function keepStagedAlive(h, everyMs = 45_000) {
  const timer = setInterval(() => {
    fetch(`${h.base}/v1/jobs/${h.jid}`, { headers: { Authorization: 'Bearer ' + h.serverTicket }, cache: 'no-store' }).catch(() => {});
  }, everyMs);
  // never keep the function alive on its own account
  if (typeof timer.unref === 'function') timer.unref();
  return () => clearInterval(timer);
}

/** Best effort: destroys the staged file right away (used when a conversion fails). */
async function discard(h) {
  try {
    await fetch(`${h.base}/v1/jobs/${h.jid}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + h.serverTicket } });
  } catch { /* the service's own TTL sweeper removes it anyway */ }
}

module.exports = { stagedConfig, openStaged, readSource, depositOutput, discard, keepStagedAlive };
