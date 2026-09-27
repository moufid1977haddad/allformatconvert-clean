// Unit tests for app/lib/csvEncoding.js. Run: node scripts/csv-tests/csv-encoding.test.mjs
import assert from 'node:assert/strict';
import { detectEncoding, isValidUtf8, ansiCodePageFor, parseLocaleNumber, detectDecimalSeparator, numericColumns } from '../../app/lib/csvEncoding.js';

const enc = new TextEncoder();
let n = 0; const t = (name, fn) => { fn(); n++; console.log('PASS', name); };

t('BOM UTF-8', () => assert.equal(detectEncoding(new Uint8Array([0xef, 0xbb, 0xbf, 0x41]), 'fr').encoding, 'utf-8'));
t('BOM UTF-16LE', () => assert.equal(detectEncoding(new Uint8Array([0xff, 0xfe, 0x41, 0]), 'fr').encoding, 'utf-16le'));
t('valid UTF-8 without BOM', () => assert.deepEqual(detectEncoding(enc.encode('Café;Thé'), 'fr'), { encoding: 'utf-8', reason: 'valid' }));
t('Windows-1252 "Café" (0xE9) -> ANSI of a French browser', () => assert.deepEqual(detectEncoding(new Uint8Array([0x43, 0x61, 0x66, 0xe9, 0x3b]), 'fr-CA'), { encoding: 'windows-1252', reason: 'ansi' }));
t('Cyrillic ANSI on a Russian browser', () => assert.equal(detectEncoding(new Uint8Array([0xcf, 0xf0, 0xe8]), 'ru-RU').encoding, 'windows-1251'));
t('code pages', () => { assert.equal(ansiCodePageFor('ja'), 'shift_jis'); assert.equal(ansiCodePageFor('zh-TW'), 'big5'); assert.equal(ansiCodePageFor('zh-CN'), 'gbk'); assert.equal(ansiCodePageFor('de-DE'), 'windows-1252'); assert.equal(ansiCodePageFor('pl'), 'windows-1250'); });
t('UTF-8 sequence cut at the end of a sample is still valid', () => assert.equal(isValidUtf8(enc.encode('abcé').subarray(0, 4)), true));
t('overlong / invalid lead bytes rejected', () => { assert.equal(isValidUtf8(new Uint8Array([0xc0, 0x80, 0x41])), false); assert.equal(isValidUtf8(new Uint8Array([0xe9, 0x41, 0x41])), false); });

const cases = [
  ['12,5', ',', 12.5], ['1 234,5', ',', 1234.5], ['1 234,5', ',', 1234.5], ['1.234,5', ',', 1234.5], ['0,99', ',', 0.99], ['-3,2', ',', -3.2], ['2469', ',', 2469],
  ['0612345678', ',', null], ['007', ',', null], ['28/09/2026', ',', null], ['12,5 €', ',', null], ['1234567890123456', ',', null], ['12.5', ',', null],
  ['12.5', '.', 12.5], ['1,234.5', '.', 1234.5], ['12,5', '.', null], ['0', '.', 0], ['', '.', null],
];
for (const [s, d, want] of cases) t(`parseLocaleNumber(${JSON.stringify(s)}, ${d}) = ${want}`, () => assert.equal(parseLocaleNumber(s, d), want));

t('decimal separator: ; file with 12,5 -> ","', () => assert.equal(detectDecimalSeparator([['a', 'b'], ['12,5', '3']], ';'), ','));
t('decimal separator: , file -> "."', () => assert.equal(detectDecimalSeparator([['a'], ['12.5']], ','), '.'));
t('decimal separator: ; file with 12.5 -> "."', () => assert.equal(detectDecimalSeparator([['a'], ['12.5'], ['3.25']], ';'), '.'));
t('numeric columns: text, number, phone, date', () => assert.deepEqual(numericColumns([['n', 'p', 'tel', 'd'], ['Café', '12,5', '0612345678', '28/09/2026'], ['Thé', '', '0712345678', '27/09/2026'], ['x', '1 234,5', '0512345678', '']], ','), [false, true, false, false]));
console.log(`${n} passed`);
