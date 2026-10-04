// P32 (04/10) — the REAL /api/pdf-render handler (lib/pdfRender.js) served on its own port for the local browser bench,
// with an in-memory rate limit instead of Supabase (rule of 28/08: no local script writes usage_counters). The bench
// sends the page's /api/pdf-render requests here (scripts/p32/pdf-render-fallback.mjs --route-origin=…): Playwright's
// request interception does not expose the file part of a multipart body, so it cannot forward it itself.
//   node scripts/p32/local-render-route.mjs <port> <pdf-tools url> <pdf-tools key>
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { handlePdfRender } = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'lib', 'pdfRender.js'));
const [port, serviceUrl, apiKey] = process.argv.slice(2);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'X-Render-Dpi, X-Render-Pages, X-Render-Reduced', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST' };
let pages = 0;

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(`http://127.0.0.1:${port}${req.url}`, { method: req.method, headers: req.headers, body: Buffer.concat(chunks) });
  const out = await handlePdfRender(request, {
    env: { PDFTOOLS_SERVICE_URL: serviceUrl, PDFTOOLS_API_KEY: apiKey },
    rateLimit: async () => { pages++; return pages > 300 ? { allowed: false, layer: 'hour', retryAfterSeconds: 3600 } : { allowed: true }; },
    openStaged: () => ({ ok: false, status: 503, error: 'Large-file rendering is not available in this local bench.' }),
  });
  const headers = { ...cors };
  out.headers.forEach((v, k) => { headers[k] = v; });
  res.writeHead(out.status, headers);
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(Number(port), '127.0.0.1', () => console.log(`local /api/pdf-render on :${port} → ${serviceUrl}`));
