// P24: PDF Redact's patterns find what they promise across pdf.js items, and leave ordinary numbers and dates alone.
import assert from 'node:assert/strict';
import { patternSpans, termsOf, annotationMatches } from '../../app/lib/pdfRedact.js';
import { parsePageRange } from '../../app/lib/pageRange.js';
assert.deepEqual(parsePageRange('1 - 3', 10), [1, 2, 3]);
assert.deepEqual(parsePageRange('5 -7, 9', 10), [5, 6, 7, 9]);
assert.deepEqual(parsePageRange('2- 4', 10), [2, 3, 4]);
assert.throws(() => parsePageRange('-', 10));
const hit = (strs, kind) => patternSpans(strs, [kind]).map((s) => strs[s.k].slice(s.c0, s.c1));
assert.deepEqual(hit(['Contact: ', 'jane.doe@example.co.uk', ' today'], 'email'), ['jane.doe@example.co.uk']);
assert.deepEqual(hit(['Mail jane', '@example.com now'], 'email'), ['jane', '@example.com']); // split over two items
for (const p of ['+1 514 555 0199', '(514) 555-0199', '06 12 34 56 78', '+33 6 12 34 56 78', '514.555.0199']) assert.equal(hit(['Tel ' + p + ' end'], 'phone').join(''), p, p);
for (const notPhone of ['2026-10-02', 'Invoice 12345', 'Total 1 234,56 €', 'Page 3 of 12']) assert.deepEqual(hit([notPhone], 'phone'), [], notPhone);
assert.deepEqual(patternSpans(['Tel 12', '34 56 78 90'], ['phone'], [true]).length, 0); // a line end is never crossed
assert.deepEqual(hit(['Card 4111 1111 1111 1111 exp'], 'card'), ['4111 1111 1111 1111']); // Visa test number (Luhn)
assert.deepEqual(hit(['Ref 4111 1111 1111 1112'], 'card'), []); // fails Luhn
assert.deepEqual(termsOf('Jean Dupont\n\n  ACME, Inc.  \n'), ['Jean Dupont', 'ACME, Inc.']);
assert.equal(annotationMatches('call 514-555-0199', [], ['phone']), true);
assert.equal(annotationMatches('nothing here', ['secret'], ['email']), false);
// review 03/10: numbers next to other numbers, e-mails with an apostrophe / accents
assert.deepEqual(hit(['Card 4111 1111 1111 1111 123 exp'], 'card'), ['4111 1111 1111 1111 123']); // the CVV goes with it
assert.ok(hit(['4111111111111111', ' ', '12/27'], 'card').includes('4111111111111111'));
// two numbers in a row: the whole run is covered, so neither is left readable
assert.deepEqual(hit(['5555 5555 5555 4444 4111 1111 1111 1111'], 'card'), ['5555 5555 5555 4444 4111 1111 1111 1111']);
assert.deepEqual(hit(['514-555-0199 514-555-0200'], 'phone'), ['514-555-0199 514-555-0200']);
assert.deepEqual(hit(['Tel 06 12 34 56 78 06 98 76 54 32'], 'phone'), ['06 12 34 56 78 06 98 76 54 32']);
assert.deepEqual(hit(['NY 10001-1234 212 555 0199'], 'phone'), ['10001-1234 212 555 0199']);
assert.deepEqual(hit(["Write o'brien@example.com now"], 'email'), ["o'brien@example.com"]);
assert.deepEqual(hit(['Écrire à josé@exemple.fr'], 'email'), ['josé@exemple.fr']);
console.log('redact-patterns: all passed');
