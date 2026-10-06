// P37 lot 1 — XML to JSON: an invalid XML message must give the line and column of the error. Before: the page showed
// only fast-xml-parser's msg ("char '&' is not expected."), so the position was known only for a mismatched closing
// tag, whose message happens to name the opening tag's line.
// Oracle: XMLValidator's own err.line / err.col; xmllint, browsers' DOMParser and codebeautify all give a line.
// Run: node scripts/p37/xml-to-json.test.mjs
import assert from 'node:assert/strict';
import { XMLValidator } from 'fast-xml-parser';

let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log('  PASS', name); } catch (e) { failed++; console.log('  FAIL', name, '\n   ', String(e.message).split('\n').slice(0, 6).join('\n    ')); } };
let xmlErrorMessage;
try { ({ xmlErrorMessage } = await import(new URL('../../app/tools/developer-tools/xml-to-json/xmlError.js', import.meta.url))); }
catch (e) { console.log('  (module missing before the fix: ' + e.code + ')'); xmlErrorMessage = (v) => v?.err?.msg || 'Invalid XML'; /* the page's code before the fix */ }
const msg = (xml) => xmlErrorMessage(XMLValidator.validate(xml));

await test('bad character: line and column given', () => {
  assert.equal(msg('<a>\n  <b>&</b>\n</a>'), "char '&' is not expected. (line 2, column 6)");
});
await test('attribute without value: line and column', () => {
  assert.equal(msg('<a>\n  <b x=1/>\n</a>'), "Attribute 'x' is without value. (line 2, column 6)");
});
await test('mismatched closing tag: position of the closing tag added', () => {
  assert.equal(msg('<a><b></a>'), "Expected closing tag 'b' (opened in line 1, col 4) instead of closing tag 'a'. (line 1, column 7)");
});
await test('no column known: line only', () => {
  assert.equal(msg(''), 'Start tag expected. (line 1)');
});
await test('valid XML: no message', () => {
  assert.equal(xmlErrorMessage(XMLValidator.validate('<a>1</a>')), '');
});
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
