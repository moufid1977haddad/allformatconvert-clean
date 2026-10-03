// P27: serve the LOCAL production build (`next start`) the way Vercel serves www -- HTTPS with HTTP/2 and Brotli --
// so a local Lighthouse run measures the build, not the difference between `next start` (HTTP/1.1, gzip) and the CDN
// (measured in P18: the same build lost ≈ 0.9 s of LCP to HTTP/1.1 alone). No caching, no rewriting: every request is
// passed to `next start` and its answer relayed, the body re-compressed with Brotli when the browser accepts it.
//   node scripts/perf/h2-proxy.mjs <upstream=http://localhost:3100> <port=3443> <cert.pem> <key.pem>
// (a self-signed certificate: run Chrome / Lighthouse with --ignore-certificate-errors)
import http2 from 'node:http2';
import http from 'node:http';
import fs from 'node:fs';
import zlib from 'node:zlib';

const [upstream = 'http://localhost:3100', port = '3443', cert, key] = process.argv.slice(2);
const up = new URL(upstream);
const HOP = new Set(['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-connection', 'te', 'host', 'http2-settings']);

const server = http2.createSecureServer({ cert: fs.readFileSync(cert), key: fs.readFileSync(key), allowHTTP1: true }, (req, res) => {
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) if (!k.startsWith(':') && !HOP.has(k)) headers[k] = v;
  headers.host = up.host;
  headers['accept-encoding'] = 'gzip, identity';
  const p = http.request({ hostname: up.hostname, port: up.port, path: req.url, method: req.method, headers }, (r) => {
    const out = {};
    for (const [k, v] of Object.entries(r.headers)) if (!HOP.has(k) && k !== 'content-length' && k !== 'content-encoding') out[k] = v;
    const acceptsBr = /\bbr\b/.test(req.headers['accept-encoding'] || '');
    const type = String(r.headers['content-type'] || '');
    const compressible = /text\/|javascript|json|xml|svg|css|x-component/.test(type);
    let body = r;
    if (r.headers['content-encoding'] === 'gzip') body = r.pipe(zlib.createGunzip());
    if (acceptsBr && compressible) {
      out['content-encoding'] = 'br';
      res.writeHead(r.statusCode, out);
      body.pipe(zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })).pipe(res);
    } else {
      res.writeHead(r.statusCode, out);
      body.pipe(res);
    }
  });
  p.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
  req.pipe(p);
});
server.listen(Number(port), () => console.log(`h2 proxy https://localhost:${port} -> ${upstream}`));
