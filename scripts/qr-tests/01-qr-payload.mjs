// QR content per type (the formats phone cameras read). Run: node scripts/qr-tests/01-qr-payload.mjs
import assert from 'node:assert/strict';
import { buildPayload } from '../../app/lib/qrPayload.js';
import { logoBox, QUIET } from '../../app/lib/qrRender.js';

let pass = 0;
const ok = (n, fn) => { fn(); pass++; console.log('PASS', n); };
const P = (t, f) => buildPayload(t, f).payload;
const E = (t, f) => buildPayload(t, f).error;

ok('url gets a scheme, bad url refused', () => {
  assert.equal(P('url', { url: 'example.com/a?b=1' }), 'https://example.com/a?b=1');
  assert.equal(P('url', { url: 'http://x.org' }), 'http://x.org');
  assert.ok(E('url', { url: 'http://' }));
});
ok('wifi: ZXing format, special characters escaped', () => {
  assert.equal(P('wifi', { ssid: 'Café;Net', password: 'p:a"ss\\1', encryption: 'WPA' }), 'WIFI:T:WPA;S:Café\\;Net;P:p\\:a\\"ss\\\\1;;');
  assert.equal(P('wifi', { ssid: 'Open', encryption: 'nopass', hidden: true }), 'WIFI:T:nopass;S:Open;H:true;;');
  assert.match(E('wifi', { ssid: 'X', encryption: 'WPA' }), /password/);
});
ok('vcard 3.0 with escaping and CRLF', () => {
  const v = P('vcard', { firstName: 'Ana', lastName: 'Silva, Jr', phone: '+1 (555) 010-2030', email: 'a@b.co', org: 'A;B' });
  assert.ok(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\nN:Silva\\, Jr;Ana;;;\r\nFN:Ana Silva\\, Jr\r\nORG:A\\;B\r\n'));
  assert.ok(v.includes('TEL;TYPE=CELL:+15550102030') && v.endsWith('END:VCARD'));
});
ok('email, phone, sms, geo', () => {
  assert.equal(P('email', { to: 'a@b.co', subject: 'Hi there', body: 'x&y' }), 'mailto:a@b.co?subject=Hi%20there&body=x%26y');
  assert.ok(E('email', { to: 'nope' }));
  assert.equal(P('phone', { phone: '+33 1 23 45 67 89' }), 'tel:+33123456789');
  assert.equal(P('sms', { phone: '555-0100', message: 'On my way' }), 'SMSTO:5550100:On my way');
  assert.equal(P('geo', { lat: '48.8584', lng: '2.2945' }), 'geo:48.8584,2.2945');
  assert.ok(E('geo', { lat: '91', lng: '0' }));
});
ok('logo box centred on whole modules, about 5 % of the area', () => {
  for (const n of [21, 25, 33, 57]) {
    const b = logoBox(n);
    assert.equal((b.x - QUIET) * 2 + b.s, n);
    assert.ok((b.s * b.s) / (n * n) <= 0.06, `${n}: ${b.s}`);
  }
});
console.log(`\n${pass} passed`);
