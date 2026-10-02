// P25 (03/10, E4): fetch a URL typed by a visitor without letting it reach our own network (SSRF).
//
// Rules (owner's decision E4, reviewed independently):
//   - http and https only, on their standard ports (80, 443); no user:password@ in the address;
//   - the host name is resolved here, and EVERY address it resolves to must be public (private, loopback, link-local,
//     carrier-grade NAT, metadata 169.254.169.254, multicast, documentation, benchmarking, IPv6 unique-local, IPv4
//     embedded in IPv6 — mapped, NAT64, 6to4 — are refused; only global unicast IPv6 2000::/3 is accepted);
//   - the connection is made to the address that was checked (the lookup is pinned), so a DNS answer that changes
//     between the check and the connection (DNS rebinding) cannot redirect it;
//   - redirects are followed by hand, at most MAX_REDIRECTS, each new address checked again by the same rules;
//   - a time limit for the whole request and a size limit on the DECOMPRESSED body (a gzip bomb stops at the limit).
// The same function fetches the page and every resource it uses (style sheets, images, fonts).
const http = require('node:http');
const https = require('node:https');
const dns = require('node:dns');
const net = require('node:net');
const zlib = require('node:zlib');

const MAX_REDIRECTS = 5;
const ALLOWED_PORTS = new Set(['', '80', '443']);

class FetchRefused extends Error {
  constructor(message, code) { super(message); this.name = 'FetchRefused'; this.code = code; }
}

const v4Blocked = new net.BlockList();
for (const [a, p] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.31.196.0', 24], ['192.52.193.0', 24], ['192.88.99.0', 24],
  ['192.168.0.0', 16], ['192.175.48.0', 24], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
]) v4Blocked.addSubnet(a, p, 'ipv4');

const v6Global = new net.BlockList();
v6Global.addSubnet('2000::', 3, 'ipv6');
const v6Blocked = new net.BlockList();
for (const [a, p] of [
  ['2001::', 23], // IETF protocol assignments: Teredo 2001::/32, benchmarking, ORCHID…
  ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20], // documentation; 6to4 (checked below through its IPv4 too)
]) v6Blocked.addSubnet(a, p, 'ipv6');

// IPv6 as 8 numbers, or null.
function v6Words(ip) {
  let s = ip.toLowerCase();
  const pct = s.indexOf('%'); if (pct >= 0) s = s.slice(0, pct);
  const tail4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (tail4) {
    const o = tail4[1].split('.').map(Number);
    s = s.slice(0, -tail4[1].length) + ((o[0] << 8) | o[1]).toString(16) + ':' + ((o[2] << 8) | o[3]).toString(16);
  }
  const [head, tail] = s.split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined ? (tail ? tail.split(':') : []) : [];
  const fill = s.includes('::') ? 8 - h.length - t.length : 0;
  const words = [...h, ...Array(fill).fill('0'), ...t].map((x) => parseInt(x, 16));
  return words.length === 8 && words.every((w) => Number.isInteger(w) && w >= 0 && w <= 0xffff) ? words : null;
}
const v4FromWords = (hi, lo) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

/** true when the address may be contacted from a visitor's request. */
function isPublicAddress(ip) {
  const family = net.isIP(ip);
  if (family === 4) return !v4Blocked.check(ip, 'ipv4');
  if (family !== 6) return false;
  const w = v6Words(ip);
  if (!w) return false;
  // IPv4 inside IPv6: mapped ::ffff:a.b.c.d, NAT64 64:ff9b::a.b.c.d (and 64:ff9b:1::/48), 6to4 2002:ab:cd::
  if (w.slice(0, 5).every((x) => x === 0) && w[5] === 0xffff) return isPublicAddress(v4FromWords(w[6], w[7]));
  if (w[0] === 0x64 && w[1] === 0xff9b) return w[2] === 0 && w.slice(3, 6).every((x) => x === 0) ? isPublicAddress(v4FromWords(w[6], w[7])) : false;
  if (w[0] === 0x2002) return false; // 6to4: carries an IPv4 behind a relay — refused outright, whatever it embeds
  return v6Global.check(ip, 'ipv6') && !v6Blocked.check(ip, 'ipv6');
}

/** Parses and checks a visitor's address; returns a URL or throws FetchRefused (message for the visitor). */
function checkUrl(raw, base) {
  let u;
  try { u = new URL(raw, base); } catch { throw new FetchRefused('This is not a web address. Type it like https://example.com/page.', 'bad_url'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new FetchRefused('Only http:// and https:// addresses can be converted.', 'bad_scheme');
  if (u.username || u.password) throw new FetchRefused('Addresses with a user name or password in them cannot be converted.', 'credentials');
  if (!ALLOWED_PORTS.has(u.port)) throw new FetchRefused('Only addresses on the standard web ports (80 and 443) can be converted.', 'port');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (!host || /(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/i.test(host)) throw new FetchRefused('This address points to a private network, which cannot be reached from here.', 'private');
  if (net.isIP(host) && !isPublicAddress(host)) throw new FetchRefused('This address points to a private network, which cannot be reached from here.', 'private');
  return u;
}

async function resolvePublic(host) {
  if (net.isIP(host)) return { address: host, family: net.isIP(host) };
  let all;
  // The system resolver cannot be cancelled: a slow name server is cut off here after 5 s (review 03/10).
  let timer;
  try {
    all = await Promise.race([
      dns.promises.lookup(host, { all: true, verbatim: true }),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new FetchRefused('timeout', 'timeout')), 5000); }),
    ]);
  } catch (e) {
    if (e instanceof FetchRefused) throw e;
    throw new FetchRefused('This site could not be found (its name does not resolve).', 'dns');
  } finally { clearTimeout(timer); }
  if (!all.length) throw new FetchRefused('This site could not be found (its name does not resolve).', 'dns');
  // Every answer must be public: a name that resolves to one public and one private address is refused.
  if (all.some((a) => !isPublicAddress(a.address))) throw new FetchRefused('This address points to a private network, which cannot be reached from here.', 'private');
  return all.find((a) => a.family === 4) || all[0];
}

function decoderFor(encoding) {
  const e = String(encoding || '').trim().toLowerCase();
  if (!e || e === 'identity') return null;
  if (e === 'gzip' || e === 'x-gzip') return zlib.createGunzip();
  if (e === 'deflate') return zlib.createInflate();
  if (e === 'br') return zlib.createBrotliDecompress();
  throw new FetchRefused('The site sent its page in an encoding that cannot be read.', 'encoding');
}

// One request to one checked address; resolves with { status, headers, body } (body null for a redirect).
function requestOnce(u, pinned, { maxBytes, signal, accept, userAgent }) {
  return new Promise((resolve, reject) => {
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      protocol: u.protocol,
      hostname: u.hostname.replace(/^\[|\]$/g, ''),
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: `${u.pathname}${u.search}`,
      method: 'GET',
      agent: false,
      // Pinned: whatever the system resolver would say now, the socket goes to the address checked above.
      lookup: (_h, opts, cb) => (opts && opts.all ? cb(null, [{ address: pinned.address, family: pinned.family }]) : cb(null, pinned.address, pinned.family)),
      headers: {
        'User-Agent': userAgent,
        Accept: accept,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en,*;q=0.5',
      },
      signal,
    }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) { res.resume(); resolve({ status, headers: res.headers, body: null }); return; }
      const declared = Number(res.headers['content-length']);
      if (Number.isFinite(declared) && declared > maxBytes && !res.headers['content-encoding']) { res.destroy(); reject(new FetchRefused('too_large', 'too_large')); return; }
      let stream = res;
      try { const d = decoderFor(res.headers['content-encoding']); if (d) stream = res.pipe(d); } catch (e) { res.destroy(); reject(e); return; }
      const chunks = []; let size = 0;
      stream.on('data', (c) => {
        size += c.length;
        if (size > maxBytes) { res.destroy(); stream.destroy(); reject(new FetchRefused('too_large', 'too_large')); return; }
        chunks.push(c);
      });
      stream.on('end', () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks) }));
      stream.on('error', (e) => reject(e));
      res.on('error', (e) => reject(e));
    });
    req.on('error', reject);
    req.end();
  });
}

const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OnlineConverToolsPDF/1.0';

/**
 * Fetches a visitor's URL under the rules above.
 * @returns {Promise<{ url: string, status: number, contentType: string, body: Buffer }>}
 */
async function safeFetch(raw, { maxBytes = 5 * 1024 * 1024, timeoutMs = 15000, accept = '*/*', base, userAgent = DEFAULT_UA, signal: outer } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const onOuter = () => ctl.abort();
  if (outer) { if (outer.aborted) ctl.abort(); else outer.addEventListener('abort', onOuter, { once: true }); }
  try {
    let u = checkUrl(raw, base);
    for (let hop = 0; ; hop++) {
      const pinned = await resolvePublic(u.hostname.replace(/^\[|\]$/g, ''));
      if (ctl.signal.aborted) throw new FetchRefused('timeout', 'timeout');
      let r;
      try { r = await requestOnce(u, pinned, { maxBytes, signal: ctl.signal, accept, userAgent }); } catch (e) {
        if (e instanceof FetchRefused) throw e;
        if (ctl.signal.aborted || e.name === 'AbortError') throw new FetchRefused('timeout', 'timeout');
        throw new FetchRefused('The site could not be reached.', 'network');
      }
      if (r.body === null) {
        if (hop >= MAX_REDIRECTS) throw new FetchRefused('The site redirects too many times.', 'redirects');
        u = checkUrl(String(r.headers.location), u.href); // the new address is checked like the first one
        continue;
      }
      return { url: u.href, status: r.status, contentType: String(r.headers['content-type'] || ''), body: r.body };
    }
  } finally {
    clearTimeout(timer);
    if (outer) outer.removeEventListener('abort', onOuter);
  }
}

module.exports = { safeFetch, checkUrl, isPublicAddress, FetchRefused, MAX_REDIRECTS };
