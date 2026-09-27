// Streams a file built in the page (Zip Extractor's "Download all as ZIP") straight to the browser's downloads,
// for the browsers that have no showSaveFilePicker (Firefox, Safari). Without it the whole ZIP had to be held in
// memory as one Blob, capped at 1.9 GB. Technique of StreamSaver.js: the page hands a MessagePort to this worker,
// then opens /zipdl/<id>/<name> in a hidden frame; the worker answers that request with a stream whose chunks it
// pulls from the page one at a time (backpressure: the page never runs ahead of the disk).
// Scope: /zipdl/ only -- this worker never sees any other request of the site.
const pending = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'register' || !event.ports[0] || !/^[A-Za-z0-9]{16,64}$/.test(String(data.id))) return; // 'ping' keeps the worker awake
  pending.set(data.id, { name: String(data.name || 'download.zip'), port: event.ports[0], created: Date.now() });
  event.ports[0].postMessage({ type: 'ready' });
});

self.addEventListener('fetch', (event) => {
  const m = new URL(event.request.url).pathname.match(/^\/zipdl\/([A-Za-z0-9]{16,64})\//);
  if (!m) return;
  const job = pending.get(m[1]);
  pending.delete(m[1]); // one download per id
  if (!job) { event.respondWith(new Response('This download link has expired. Please start it again from the page.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })); return; }
  const { port, name } = job;
  let waiting = null; // the pull in progress
  port.onmessage = ({ data }) => { const w = waiting; waiting = null; if (w) w(data); };
  const stream = new ReadableStream({
    pull(controller) {
      return new Promise((resolve) => {
        waiting = (data) => {
          if (data.type === 'chunk') controller.enqueue(new Uint8Array(data.chunk));
          else if (data.type === 'end') controller.close();
          else controller.error(new Error(data.message || 'The download was stopped.'));
          resolve();
        };
        port.postMessage({ type: 'pull' });
      });
    },
    cancel() { port.postMessage({ type: 'cancel' }); },
  }, { highWaterMark: 4 });
  event.respondWith(new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      // A plain ASCII name first (WebKit ignored the RFC 5987 form alone: no name at all), then the exact UTF-8 one.
      'Content-Disposition': `attachment; filename="${name.replace(/[^\x20-\x7e]|["\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Cache-Control': 'no-store',
    },
  }));
});
