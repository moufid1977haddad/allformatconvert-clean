// P36: the daily health check also looks at the HTTPS certificate each public hostname serves (a visitor saw
// NET::ERR_CERT_AUTHORITY_INVALID on 06/10). Problems: chain not trusted by Node's Mozilla root store, expiry in under
// 14 days, an issuer other than the one Vercel uses (another issuer means DNS now points elsewhere, e.g. the Cloudflare
// proxy got switched on), or a certificate that does not name the host.
const tls = require('tls');

const CERT_HOSTS = ['www.onlineconvertools.com', 'onlineconvertools.com'];
const EXPECTED_ISSUER_ORGS = ["Let's Encrypt"];
const MIN_DAYS_LEFT = 14;

// Pure verdict from what the TLS handshake returned -- tested by scripts/p36/cert-check.test.mjs.
function certVerdict({ host, authorized, authorizationError, issuerOrg, validTo, altNames, now = Date.now() }) {
  if (!authorized) return { ok: false, detail: `chain_invalid_${authorizationError || 'unknown'}` };
  const names = String(altNames || '').split(',').map((s) => s.trim().replace(/^DNS:/, '').toLowerCase());
  const h = host.toLowerCase();
  const covers = (n) => n === h || (n.startsWith('*.') && h.endsWith(n.slice(1)) && !h.slice(0, -n.length + 1).includes('.'));
  if (!names.some(covers)) return { ok: false, detail: 'name_mismatch' };
  if (!EXPECTED_ISSUER_ORGS.includes(issuerOrg)) return { ok: false, detail: `unexpected_issuer_${String(issuerOrg || 'none').replace(/\s+/g, '_')}` };
  const daysLeft = Math.floor((Date.parse(validTo) - now) / 86400000);
  if (!Number.isFinite(daysLeft)) return { ok: false, detail: 'no_expiry_date' };
  if (daysLeft < MIN_DAYS_LEFT) return { ok: false, detail: `expires_in_${daysLeft}_days` };
  return { ok: true, detail: `${daysLeft}_days_left` };
}

function checkCertificate(host, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (r) => { if (!done) { done = true; resolve(r); } };
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate(false);
      const verdict = certVerdict({
        host,
        authorized: socket.authorized,
        authorizationError: socket.authorizationError && String(socket.authorizationError),
        issuerOrg: cert?.issuer?.O,
        validTo: cert?.valid_to,
        altNames: cert?.subjectaltname,
      });
      socket.end();
      finish(verdict);
    });
    socket.setTimeout(timeoutMs, () => { socket.destroy(); finish({ ok: false, detail: 'timeout' }); });
    socket.on('error', () => finish({ ok: false, detail: 'unreachable' }));
  });
}

module.exports = { CERT_HOSTS, MIN_DAYS_LEFT, certVerdict, checkCertificate };
