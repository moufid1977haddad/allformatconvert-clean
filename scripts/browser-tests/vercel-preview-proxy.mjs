// A protected Vercel preview served on http://localhost:<port>, the Trusted Sources token added here, server-side.
// Needed for Firefox: Playwright's request interception (vercel-preview-auth.mjs) does not reach the requests a Web
// Worker makes there, so the worker's own script went out without the token and hit Vercel's login page
// ("NetworkError"). Every request of the page goes through this proxy; the token never reaches a third party.
// Usage: node --env-file=.env.local scripts/browser-tests/vercel-preview-proxy.mjs <preview origin> [port=3200]
import http from 'node:http';
import { Readable } from 'node:stream';
const [target, port = '3200'] = process.argv.slice(2);
const token = process.env.VERCEL_OIDC_TOKEN;
if (!token) { console.error('VERCEL_OIDC_TOKEN missing (node --env-file=.env.local, after `vercel link`)'); process.exit(1); }
http.createServer(async (req, res) => {
  try {
    const headers = { ...req.headers, host: new URL(target).host, 'x-vercel-trusted-oidc-idp-token': token };
    delete headers['accept-encoding']; // bodies are passed through as they are decoded
    const r = await fetch(target + req.url, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Readable.toWeb(req), duplex: 'half', redirect: 'manual' });
    const out = {};
    r.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding', 'strict-transport-security'].includes(k)) out[k] = v; });
    res.writeHead(r.status, out);
    if (r.body) Readable.fromWeb(r.body).pipe(res); else res.end();
  } catch (e) { res.writeHead(502); res.end(String(e)); }
}).listen(Number(port), () => console.log(`${target} on http://localhost:${port}`));
