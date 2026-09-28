// Tests for app/lib/textTools.js and textCrypto.js (29/09). Oracles: the
// visible character count (graphemes), Intl.Collator's documented order,
// exact expected strings, and a Web Crypto round trip.
// Run: node scripts/converter-tests/06-text-tools.mjs
import assert from 'node:assert/strict';
const t = await import(new URL('../../app/lib/textTools.js', import.meta.url));
const c = await import(new URL('../../app/lib/textCrypto.js', import.meta.url));

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('character counter: exact breakdown', () => {
  const r = t.countCharacters('Cáfé 👨‍👩‍👧 42!');
  // C, á (a + combining accent), f, é, space, family emoji, space, 4, 2, !
  assert.deepEqual([r.characters, r.letters, r.digits, r.spaces, r.other], [10, 4, 2, 2, 2]);
  assert.equal(r.utf16Units, 'Cáfé 👨‍👩‍👧 42!'.length);
  assert.equal(r.utf8Bytes, Buffer.byteLength('Cáfé 👨‍👩‍👧 42!'));
  assert.equal(t.countCharacters('a\r\nb\n').lines, 3);
});
test('duplicate remover: CRLF, options, first occurrence kept', () => {
  assert.deepEqual(t.removeDuplicateLines('a\r\nb\r\na'), { text: 'a\nb', removed: 1 });
  assert.equal(t.removeDuplicateLines('Apple\napple\n apple ', { caseSensitive: false, trim: true }).text, 'Apple');
  assert.equal(t.removeDuplicateLines('x\n\ny\n\n', { removeEmpty: true }).text, 'x\ny');
});
test('sorter: dictionary order, accents next to base letter, numbers by value', () => {
  assert.equal(t.sortLines('zebra\néclair\nBanana\napple\nitem 10\nitem 2', 'az'), 'apple\nBanana\néclair\nitem 2\nitem 10\nzebra');
  assert.equal(t.sortLines('b\r\na', 'az'), 'a\nb');
  assert.equal(t.sortLines('ccc\n😀\nbb', 'length'), '😀\nbb\nccc');
  assert.equal(t.sortLines('a\nB\nc', 'za'), 'c\nB\na');
});
test('truncator: never splits an emoji; words keep spacing and line breaks', () => {
  assert.equal(t.truncate('ab😀cd', 3, 'characters'), 'ab😀...');
  assert.equal(t.truncate('short', 10, 'characters'), 'short');
  assert.equal(t.truncate('one two\nthree  four', 3, 'words'), 'one two\nthree...');
  assert.equal(t.truncate('one two', 2, 'words'), 'one two');
  assert.throws(() => t.truncate('x', NaN, 'words'));
});
test('lorem: exact counts, no cap at 69 words, real sentences', () => {
  const w = t.lorem(500, 'words');
  assert.equal(w.split(/\s+/).length, 500);
  assert.ok(w.startsWith('Lorem ipsum dolor sit amet'));
  const s = t.lorem(5, 'sentences');
  assert.equal((s.match(/\./g) || []).length, 5);
  assert.equal(t.lorem(3, 'paragraphs').split('\n\n').length, 3);
});
test('literal replace: $ patterns are not interpreted', () => {
  assert.deepEqual(t.literalReplaceAll('price: X', 'X', 'US$$ $& $1'), { text: 'price: US$$ $& $1', count: 1 });
});
test('encryptor: AES-GCM round trip, random output, wrong password refused, empty password refused', async () => {
  const msg = 'secret café 😀\nline 2';
  const a = await c.encryptText(msg, 'pa55');
  const b = await c.encryptText(msg, 'pa55');
  assert.notEqual(a, b);
  assert.deepEqual(await c.decryptText(a, 'pa55'), { text: msg, legacy: false });
  await assert.rejects(() => c.decryptText(a, 'wrong'), /Wrong password/);
  await assert.rejects(() => c.encryptText(msg, ''), /password/);
  const tampered = Buffer.from(a, 'base64'); tampered[tampered.length - 1] ^= 1;
  await assert.rejects(() => c.decryptText(tampered.toString('base64'), 'pa55'), /Wrong password/);
});
test('encryptor: texts from the old XOR version still decrypt, flagged legacy', async () => {
  const k = Buffer.from('key');
  const old = Buffer.from(Buffer.from('hello é', 'utf8').map((x, i) => x ^ k[i % k.length])).toString('base64');
  assert.deepEqual(await c.decryptText(old, 'key'), { text: 'hello é', legacy: true });
});

for (const [name, fn] of tests) {
  try { await fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e.message); process.exitCode = 1; }
}
console.log(`${passed}/${tests.length} passed`);
