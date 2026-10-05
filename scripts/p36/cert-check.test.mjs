// P36 lot 0: lib/certCheck.js -- pure verdicts, then real handshakes (our two hosts must pass; badssl.com's broken
// certificates must each be flagged). Run: node scripts/p36/cert-check.test.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { certVerdict, checkCertificate, CERT_HOSTS } = require('../../lib/certCheck.js');

let pass = 0, fail = 0;
const t = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const now = Date.parse('2026-10-06T12:00:00Z');
const base = { host: 'www.onlineconvertools.com', authorized: true, issuerOrg: "Let's Encrypt", validTo: 'Nov  6 23:47:52 2026 GMT', altNames: 'DNS:www.onlineconvertools.com', now };

t('valid cert ok', certVerdict(base).ok, certVerdict(base).detail);
t('untrusted chain', certVerdict({ ...base, authorized: false, authorizationError: 'SELF_SIGNED_CERT_IN_CHAIN' }).detail === 'chain_invalid_SELF_SIGNED_CERT_IN_CHAIN');
t('13 days left flagged', certVerdict({ ...base, validTo: 'Oct 19 23:00:00 2026 GMT' }).detail === 'expires_in_13_days');
t('14 days left ok', certVerdict({ ...base, validTo: 'Oct 20 13:00:00 2026 GMT' }).ok);
t('expired flagged', !certVerdict({ ...base, validTo: 'Oct  1 00:00:00 2026 GMT' }).ok);
t('Cloudflare/GTS issuer flagged', certVerdict({ ...base, issuerOrg: 'Google Trust Services' }).detail === 'unexpected_issuer_Google_Trust_Services');
t('wrong name flagged', certVerdict({ ...base, altNames: 'DNS:*.vercel.app' }).detail === 'name_mismatch');
t('wildcard covers www', certVerdict({ ...base, altNames: 'DNS:*.onlineconvertools.com' }).ok);
t('wildcard does not cover bare domain', certVerdict({ ...base, host: 'onlineconvertools.com', altNames: 'DNS:*.onlineconvertools.com' }).detail === 'name_mismatch');
t('wildcard does not cover two labels', certVerdict({ ...base, host: 'a.www.onlineconvertools.com', altNames: 'DNS:*.onlineconvertools.com' }).detail === 'name_mismatch');
t('missing date flagged', certVerdict({ ...base, validTo: undefined }).detail === 'no_expiry_date');

for (const host of CERT_HOSTS) {
  const r = await checkCertificate(host);
  t(`live ${host}`, r.ok, r.detail);
}
for (const [host, want] of [['untrusted-root.badssl.com', /^chain_invalid_/], ['expired.badssl.com', /^chain_invalid_CERT_HAS_EXPIRED/], ['wrong.host.badssl.com', /^chain_invalid_|^name_mismatch/], ['self-signed.badssl.com', /^chain_invalid_/]]) {
  const r = await checkCertificate(host);
  t(`live broken ${host} flagged`, !r.ok && want.test(r.detail), r.detail);
}
console.log(`\n${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
