// P24: PDF Redact's patterns find what they promise across pdf.js items, and leave ordinary numbers and dates alone.
import assert from 'node:assert/strict';
import { patternSpans, termsOf, annotationMatches } from '../../app/lib/pdfRedact.js';
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
console.log('redact-patterns: all passed');
