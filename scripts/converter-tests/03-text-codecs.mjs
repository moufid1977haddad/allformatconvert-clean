// Tests for app/lib/textCodecs.js (29/09). Oracle: Node's Buffer (base64,
// base64url, hex, UTF-8) and the HTML5 spec's entity values.
// Run: node scripts/converter-tests/03-text-codecs.mjs
import assert from 'node:assert/strict';
const { base64Encode, base64Decode, textToHex, hexToText, htmlEncode, htmlDecode } = await import(new URL('../../app/lib/textCodecs.js', import.meta.url));

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e); process.exitCode = 1; } };
const SAMPLES = ['', 'Hello', 'café ☕', '日本語', '😀👍🏽', 'a\r\nb\u0000c', '﻿BOM', 'x'.repeat(100000) + 'é'];

test('Base64 encode = Buffer (UTF-8), standard and URL-safe', () => {
  for (const s of SAMPLES) {
    assert.equal(base64Encode(s), Buffer.from(s, 'utf8').toString('base64'));
    assert.equal(base64Encode(s, { urlSafe: true }), Buffer.from(s, 'utf8').toString('base64url'));
  }
});
test('Base64 decode round-trips, accepts URL-safe, no padding, line breaks', () => {
  for (const s of SAMPLES) {
    const b = Buffer.from(s, 'utf8');
    assert.equal(base64Decode(b.toString('base64')).text, s);
    assert.equal(base64Decode(b.toString('base64url')).text, s);
    assert.equal(base64Decode(b.toString('base64').replace(/(.{76})/g, '$1\r\n')).text, s);
  }
});
test('Base64 decode: invalid input refused with a reason; binary identified', () => {
  assert.throws(() => base64Decode('abc$'), /not valid Base64/);
  assert.throws(() => base64Decode('abcde'), /length/);
  const r = base64Decode(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]).toString('base64'));
  assert.equal(r.text, null); assert.equal(r.bytes.length, 5);
});
test('Hex = Buffer UTF-8 hex; decoding accepts separators and prefixes', () => {
  for (const s of SAMPLES) {
    const hex = Buffer.from(s, 'utf8').toString('hex');
    assert.equal(textToHex(s, ''), hex);
    assert.equal(hexToText(hex), s);
    assert.equal(hexToText(textToHex(s)), s);
  }
  assert.equal(textToHex('é'), 'c3 a9');
  assert.equal(hexToText('0x48,0x69'), 'Hi');
  assert.equal(hexToText('\\x48\\x69'), 'Hi');
  assert.equal(hexToText('48:69'), 'Hi');
});
test('Hex: odd digits, non-hex and invalid UTF-8 are refused', () => {
  assert.throws(() => hexToText('486'), /odd/);
  assert.throws(() => hexToText('zz'), /not valid hex/);
  assert.throws(() => hexToText('ff fe'), /UTF-8/);
});
const NAMED = { '&nbsp;': ' ', '&copy;': '©', '&euro;': '€', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
const resolve = (e) => NAMED[e] ?? null;
test('HTML decode: single pass (&amp;lt; -> &lt;), numeric dec/hex/emoji, tags kept', () => {
  assert.equal(htmlDecode('&amp;lt;b&amp;gt;', resolve), '&lt;b&gt;');
  assert.equal(htmlDecode('<b>x</b> &amp; y &#8364; &#x20AC; &#x1F600; &copy; &unknown; AT&T', resolve), '<b>x</b> & y € € 😀 © &unknown; AT&T');
  assert.equal(htmlDecode('&#0; &#xD800; &#1114112;', resolve), '� � �');
});
test('HTML encode then decode gives the original back', () => {
  for (const s of ['<a href="x">it\'s & more</a>', '&amp;', '😀 < >']) assert.equal(htmlDecode(htmlEncode(s), resolve), s);
  assert.equal(htmlEncode('<a href="x">it\'s & more</a>'), '&lt;a href=&quot;x&quot;&gt;it&#39;s &amp; more&lt;/a&gt;');
});
console.log(`${passed} passed`);
