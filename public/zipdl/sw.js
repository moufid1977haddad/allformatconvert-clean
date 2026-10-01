// Streams a file built in the page (Zip Extractor's "Download all as ZIP") straight to the browser's downloads,
// for the browsers that have no showSaveFilePicker (Firefox, Safari). Without it the whole ZIP had to be held in
// memory as one Blob, capped at 1.9 GB. Technique of StreamSaver.js: the page hands a MessagePort to this worker,
// then opens /zipdl/<id>/<name> in a hidden frame; the worker answers that request with a stream whose chunks it
// pulls from the page one at a time (backpressure: the page never runs ahead of the disk).
// Scope: /zipdl/ only -- this worker never sees any other request of the site.
//
// Second use (30/09, iPhone): a file already made in the page (a Blob: PDF, video, image...) is served the way
// iLovePDF and Smallpdf serve theirs -- as a response with "Content-Disposition: attachment" -- because iOS Safari
// opens a blob: link to a PDF or a video in its viewer instead of saving it, and saves nothing from a data: link.
// Message { type: 'file', id, name, blob }: the next request for /zipdl/<id>/... gets that blob, once (pages of
// before P21 still open in a tab).
// Since P21 (02/10): the page puts the file in Cache Storage ahead of time and links to /zipdl/f/<id>/<name>; this
// worker answers that address from the cache, as many times as it is asked, so the tap itself is a plain navigation
// (iOS keeps a tap's permission to download for about one second only; the cache survives iOS stopping this worker).
const STAGED_CACHE = 'ocv-downloads-v1';
const pending = new Map();
const files = new Map();
const disposition = (name) => `attachment; filename="${name.replace(/[^\x20-\x7e]|["\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'hello') { if (event.ports[0]) event.ports[0].postMessage({ type: 'hello', staged: true }); return; }
  if (data.type === 'file' && /^[A-Za-z0-9]{16,64}$/.test(String(data.id)) && data.blob instanceof Blob) {
    for (const [id, f] of files) if (Date.now() - f.created > 60000) files.delete(id);
    files.set(data.id, { name: String(data.name || 'download'), blob: data.blob, created: Date.now() });
    if (event.ports[0]) event.ports[0].postMessage({ type: 'ready' });
    return;
  }
  if (data.type !== 'register' || !event.ports[0] || !/^[A-Za-z0-9]{16,64}$/.test(String(data.id))) return; // 'ping' keeps the worker awake
  for (const [id, job] of pending) if (Date.now() - job.created > 60000) pending.delete(id); // never picked up
  pending.set(data.id, { name: String(data.name || 'download.zip'), port: event.ports[0], created: Date.now() });
  event.ports[0].postMessage({ type: 'ready' });
});

self.addEventListener('fetch', (event) => {
  const staged = new URL(event.request.url).pathname.match(/^\/zipdl\/f\/([A-Za-z0-9]{16,64})\//);
  if (staged) {
    event.respondWith(caches.open(STAGED_CACHE).then(async (c) => {
      const hit = await c.match(event.request, { ignoreSearch: true });
      if (hit) return hit;
      for (const req of await c.keys()) if (req.url.includes(`/zipdl/f/${staged[1]}/`)) return c.match(req);
      return new Response('This download has expired. Please make the file again on the page.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }));
    return;
  }
  const m = new URL(event.request.url).pathname.match(/^\/zipdl\/([A-Za-z0-9]{16,64})\//);
  if (!m) return;
  const file = files.get(m[1]);
  if (file) {
    files.delete(m[1]);
    event.respondWith(new Response(file.blob, { headers: {
      'Content-Type': file.blob.type || 'application/octet-stream',
      'Content-Length': String(file.blob.size),
      'Content-Disposition': disposition(file.name),
      'Cache-Control': 'no-store',
    } }));
    return;
  }
  const job = pending.get(m[1]);
  pending.delete(m[1]); // one download per id
  if (!job) { event.respondWith(new Response('This download link has expired. Please start it again from the page.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })); return; }
  const { port, name } = job;
  let waiting = null; // the pull in progress
  let stopped = null; // an error or cancel from the page that came between two pulls: never end such a file cleanly
  port.onmessage = ({ data }) => { const w = waiting; waiting = null; if (w) w(data); else if (data && data.type === 'error') stopped = data; };
  const stream = new ReadableStream({
    pull(controller) {
      if (stopped) { controller.error(new Error(stopped.message || 'The download was stopped.')); return undefined; }
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
      'Content-Disposition': disposition(name),
      'Cache-Control': 'no-store',
    },
  }));
});
