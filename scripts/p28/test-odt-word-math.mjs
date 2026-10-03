// P28: lib/odtWordMath.js -- unit cases, then the real corpus (an ODT written by Word, an ODT written by LibreOffice).
//   node scripts/p28/test-odt-word-math.mjs [out-dir]   (writes the rewritten Word ODT there when given)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { normalizeWordMathXml, normalizeWordMathInOdt } from '../../lib/odtWordMath.js';

const M = 'xmlns="http://www.w3.org/1998/Math/MathML"';
// flat formula + math italic -> one mrow, base letters (single-letter mi stays implicit italic)
assert.equal(normalizeWordMathXml(`<?xml version="1.0"?><math ${M} display="block"><mi>𝑥</mi><mo>=</mo><mn>2</mn></math>`),
  `<?xml version="1.0"?><math ${M} display="block"><mrow><mi>x</mi><mo>=</mo><mn>2</mn></mrow></math>`);
// partial derivative as an operator, bold letter, multi-letter italic
assert.equal(normalizeWordMathXml(`<math ${M}><mrow><mo>𝜕</mo><mi>𝐁</mi><mi>𝑎𝑏</mi></mrow></math>`),
  `<math ${M}><mrow><mo mathvariant="italic">∂</mo><mi mathvariant="bold">B</mi><mi mathvariant="italic">ab</mi></mrow></math>`);
// Word's italic h (U+210E) and nabla
assert.equal(normalizeWordMathXml(`<math ${M}><mi>ℎ</mi></math>`), `<math ${M}><mi>h</mi></math>`);
assert.equal(normalizeWordMathXml(`<math ${M}><mi>𝛻</mi></math>`), `<math ${M}><mi>∇</mi></math>`);
// already fine: one child, plain letters -> untouched
assert.equal(normalizeWordMathXml(`<math ${M}><mrow><mi>x</mi><mo>+</mo></mrow></math>`), null);
// LibreOffice's own object (semantics + StarMath annotation) -> untouched even if flat
assert.equal(normalizeWordMathXml(`<math ${M}><semantics><mi>𝑥</mi><annotation encoding="StarMath 5.0">x</annotation></semantics></math>`), null);
// prefixed namespace
assert.equal(normalizeWordMathXml(`<math:math xmlns:math="http://www.w3.org/1998/Math/MathML"><math:mi>a</math:mi><math:mi>b</math:mi></math:math>`),
  `<math:math xmlns:math="http://www.w3.org/1998/Math/MathML"><math:mrow><math:mi>a</math:mi><math:mi>b</math:mi></math:mrow></math:math>`);
// mixed styles in one token -> token left alone (still wrapped)
assert.equal(normalizeWordMathXml(`<math ${M}><mi>𝐚𝑏</mi><mo>=</mo></math>`), `<math ${M}><mrow><mi>𝐚𝑏</mi><mo>=</mo></mrow></math>`);
// independent review (P28): Greek symbol variants stay themselves (NFKC would fold 𝜙 to φ, 𝜖 to ε)
assert.equal(normalizeWordMathXml(`<math ${M}><mi>𝜙</mi></math>`), `<math ${M}><mi>ϕ</mi></math>`);
assert.equal(normalizeWordMathXml(`<math ${M}><mi>𝜑</mi></math>`), `<math ${M}><mi>φ</mi></math>`);
assert.equal(normalizeWordMathXml(`<math ${M}><mi>𝜖</mi></math>`), `<math ${M}><mi>ϵ</mi></math>`);
// styles LibreOffice cannot draw are left alone (𝔼 would become a plain E)
assert.equal(normalizeWordMathXml(`<math ${M}><mi>𝔼</mi></math>`), null);
assert.equal(normalizeWordMathXml(`<math ${M}><mi>𝟙</mi></math>`), null);
// a token mixing math letters with ordinary text is left alone
assert.equal(normalizeWordMathXml(`<math ${M}><mtext>if 𝑥</mtext></math>`), null);
assert.equal(normalizeWordMathXml(`<math ${M}><mi>𝑑x</mi></math>`), null);
// self-closing child counts as a child
assert.equal(normalizeWordMathXml(`<math ${M}><mspace width="1em"/><mi>x</mi></math>`), `<math ${M}><mrow><mspace width="1em"/><mi>x</mi></mrow></math>`);

const word = fs.readFileSync('scripts/p28/equations/corpus/word-omml.odt');
const r = await normalizeWordMathInOdt(word);
assert.equal(r.patched, 6, 'the 6 formula objects Word wrote');
const z = await JSZip.loadAsync(r.buffer);
assert.equal(Object.keys(z.files)[0], 'mimetype', 'mimetype stays first');
assert.equal(r.buffer.subarray(30, 38).toString(), 'mimetype');
assert.equal(r.buffer.readUInt16LE(8), 0, 'mimetype stored, not compressed');
assert.match(await z.file('Object 6/content.xml').async('string'), /<mo mathvariant="italic">∂<\/mo>/);
const lo = fs.readFileSync('scripts/p28/equations/corpus/lomath-from-word.odt');
const r2 = await normalizeWordMathInOdt(lo);
assert.equal(r2.patched, 0);
assert.equal(r2.buffer, lo, 'LibreOffice ODT returned byte for byte');
const plain = fs.readFileSync('docs/audit/fixtures-p21-office/text.odt');
assert.equal((await normalizeWordMathInOdt(plain)).buffer, plain, 'ODT without formula returned byte for byte');
const out = process.argv[2];
if (out) { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'word-omml-fixed.odt'), r.buffer); }
console.log('test-odt-word-math: all passed');
