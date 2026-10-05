// P33 (05/10) — the REAL /api/pdf-render (lib/pdfRender.js) and /api/pdf-ocr (lib/pdfOcr.js) handlers served on their
// own port for the local browser benches, with in-memory rate limits instead of Supabase (rule of 28/08: no local
// script writes usage_counters). The benches send the page's requests here (--route-origin=…): Playwright's request
// interception does not expose the file part of a multipart body, so it cannot forward it itself.
//   node scripts/p33/local-routes.mjs <port> <pdf-tools url> <pdf-tools key> [--ocr-cap=N]
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { handlePdfRender } = require(path.join(root, 'lib', 'pdfRender.js'));
const { handlePdfOcr } = require(path.join(root, 'lib', 'pdfOcr.js'));
const [port, serviceUrl, apiKey] = process.argv.slice(2);
const ocrCap = Number((process.argv.find((a) => a.startsWith('--ocr-cap=')) || '--ocr-cap=300').split('=')[1]);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'X-Render-Dpi, X-Render-Pages, X-Render-Reduced', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST' };
const counts = { render: 0, ocr: 0 };

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (req.method === 'GET' && req.url === '/counts') { res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }); return res.end(JSON.stringify(counts)); }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  // the bench page (localhost) calls this port (127.0.0.1): cross-site for the browser, same-origin on the real site,
  // where the route refuses Sec-Fetch-Site: cross-site — that refusal is tested by the route tests, not here
  const headers = { ...req.headers };
  delete headers['sec-fetch-site'];
  const request = new Request(`http://127.0.0.1:${port}${req.url}`, { method: req.method, headers, body: Buffer.concat(chunks) });
  const ocr = req.url.startsWith('/api/pdf-ocr');
  const kind = ocr ? 'ocr' : 'render';
  const out = await (ocr ? handlePdfOcr : handlePdfRender)(request, {
    env: { PDFTOOLS_SERVICE_URL: serviceUrl, PDFTOOLS_API_KEY: apiKey },
    rateLimit: async () => { counts[kind]++; const cap = ocr ? ocrCap : 300; return counts[kind] > cap ? { allowed: false, layer: 'hour', retryAfterSeconds: 3600 } : { allowed: true }; },
    openStaged: () => ({ ok: false, status: 503, error: 'Large files are not available in this local bench.' }),
  });
  const outHeaders = { ...cors };
  out.headers.forEach((v, k) => { outHeaders[k] = v; });
  res.writeHead(out.status, outHeaders);
  // P35: the OCR line answers as a stream of JSON lines — passed on as they come
  if (out.body) { const reader = out.body.getReader(); for (;;) { const { value, done } = await reader.read(); if (done) break; res.write(Buffer.from(value)); } }
  res.end();
}).listen(Number(port), '127.0.0.1', () => console.log(`local routes on :${port} → ${serviceUrl}`));
