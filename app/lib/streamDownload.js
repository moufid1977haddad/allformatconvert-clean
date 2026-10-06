// Saves a ReadableStream of bytes as a download WITHOUT holding it in memory, through the service worker at
// /zipdl/sw.js (see that file). For browsers without showSaveFilePicker (Firefox, Safari). Returns null when
// the browser cannot do it (no service worker: private windows, some settings), so the caller keeps its own path.
// Resolves when the last chunk has been handed to the browser's download.
const SW_URL = '/zipdl/sw.js';
const SCOPE = '/zipdl/';

async function activeWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !window.isSecureContext) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: SCOPE });
    const sw = reg.active || reg.waiting || reg.installing;
    if (!sw) return null;
    if (sw.state !== 'activated') {
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), 10000);
        sw.addEventListener('statechange', () => { if (sw.state === 'activated') { clearTimeout(t); resolve(); } else if (sw.state === 'redundant') { clearTimeout(t); reject(new Error('redundant')); } });
      });
    }
    return sw;
  } catch {
    return null;
  }
}

/**
 * @param {ReadableStream<Uint8Array>} readable
 * @param {string} name  file name offered to the visitor
 * @returns {Promise<null | { done: Promise<void>, cancel: () => void }>}
 */
export async function streamToDownload(readable, name) {
  const sw = await activeWorker();
  if (!sw) return null;
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  const { port1, port2 } = new MessageChannel();
  const ready = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('The download could not be prepared.')), 10000);
    port1.onmessage = ({ data }) => { if (data && data.type === 'ready') { clearTimeout(t); resolve(); } };
  });
  sw.postMessage({ type: 'register', id, name }, [port2]);
  try { await ready; } catch { return null; }

  const reader = readable.getReader();
  let finish, fail, cancelled = false, pulled = false;
  const done = new Promise((resolve, reject) => { finish = resolve; fail = reject; });
  const keepAlive = setInterval(() => sw.postMessage({ type: 'ping' }), 10000); // the worker must not be stopped mid-download
  const stop = () => { clearInterval(keepAlive); setTimeout(() => frame.remove(), 60000); };
  port1.onmessage = async ({ data }) => {
    if (!data) return;
    if (data.type === 'cancel') { cancelled = true; reader.cancel().catch(() => {}); stop(); fail(new Error('The download was canceled in the browser.')); return; }
    if (data.type !== 'pull') return;
    pulled = true;
    // After a cancel or an error, never answer "end": the file would be saved as complete.
    if (cancelled) { port1.postMessage({ type: 'error', message: 'Canceled.' }); return; }
    try {
      const { done: end, value } = await reader.read();
      if (cancelled) { port1.postMessage({ type: 'error', message: 'Canceled.' }); return; } // cancelled while reading
      if (end) { port1.postMessage({ type: 'end' }); stop(); finish(); return; }
      const copy = value.slice(); // a chunk may be a view into a larger buffer: send an exact copy
      port1.postMessage({ type: 'chunk', chunk: copy.buffer }, [copy.buffer]);
    } catch (e) {
      port1.postMessage({ type: 'error', message: e && e.message });
      stop(); fail(e);
    }
  };
  const frame = document.createElement('iframe');
  frame.hidden = true;
  frame.src = `${SCOPE}${id}/${encodeURIComponent(name)}`;
  document.body.appendChild(frame);
  const cancel = () => { if (cancelled) return; cancelled = true; reader.cancel().catch(() => {}); port1.postMessage({ type: 'error', message: 'Canceled.' }); stop(); };
  // The browser never asked for the file (worker stopped, download blocked): say so instead of waiting forever.
  setTimeout(() => { if (!pulled && !cancelled) { cancel(); fail(new Error('The download did not start in this browser.')); } }, 20000);
  return { done, cancel };
}
