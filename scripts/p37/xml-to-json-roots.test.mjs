// P37 suites — XML to JSON: a document with two root elements (<a></a><c/>) is not well-formed XML (XML 1.0, rule
// [1] document: one element), yet fast-xml-parser 5.11.1's validator returned true for it whenever the first root or
// the second one is self-closed, and also for text or CDATA after a self-closed root. The page then gave
// {"a":"","c":""} as if the input were valid.
// Oracle (run 06/10): Chromium's DOMParser (libxml2, as xmllint) says "Extra content at the end of the document" at
// line 1, column 8 for <a></a><c/> (the '<' of <c/>); Python's expat says "junk after document element", line 1,
// column 7 (0-based). Comments, processing instructions and whitespace after the root stay valid for both.
// Run: node scripts/p37/xml-to-json-roots.test.mjs
import assert from 'node:assert/strict';
import { XMLValidator } from 'fast-xml-parser';

let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log('  PASS', name); } catch (e) { failed++; console.log('  FAIL', name, '\n   ', String(e.message).split('\n').slice(0, 6).join('\n    ')); } };
const mod = await import(new URL('../../app/tools/developer-tools/xml-to-json/xmlError.js', import.meta.url));
const { xmlErrorMessage } = mod;
// Before the fix the page called XMLValidator.validate alone.
const validateXml = mod.validateXml || ((validate, xml) => validate(xml));
const msg = (xml) => xmlErrorMessage(validateXml(XMLValidator.validate, xml));

await test('<a></a><c/>: refused at the second root (line 1, column 8)', () => {
  assert.equal(msg('<a></a><c/>'), 'Extra content at the end of the document: a second root element <c> after <a>; XML allows only one root element. (line 1, column 8)');
});
await test('<a/>\n<b/>: refused (line 2, column 1)', () => {
  assert.equal(msg('<a/>\n<b/>'), 'Extra content at the end of the document: a second root element <b> after <a>; XML allows only one root element. (line 2, column 1)');
});
await test('<a/><b></b>: refused (line 1, column 5)', () => {
  assert.equal(msg('<a/><b></b>'), 'Extra content at the end of the document: a second root element <b> after <a>; XML allows only one root element. (line 1, column 5)');
});
await test('<a></a><b></b>: same message as the other cases, at the < of <b>', () => {
  assert.equal(msg('<a></a>\r\n<b x="1"></b>'), 'Extra content at the end of the document: a second root element <b> after <a>; XML allows only one root element. (line 2, column 1)');
});
await test('attribute value holding > does not hide the second root', () => {
  assert.equal(msg('\ufeff<a x="1>2"/>  <b/>'), 'Extra content at the end of the document: a second root element <b> after <a>; XML allows only one root element. (line 1, column 15)');
});
await test('text after a self-closed root: refused', () => {
  assert.equal(msg('<a/>text'), 'Extra content at the end of the document: text after the root element <a>. (line 1, column 5)');
});
await test('entity after a self-closed root: refused', () => {
  assert.equal(msg('<a/>&amp;'), 'Extra content at the end of the document: text after the root element <a>. (line 1, column 5)');
});
await test('CDATA after the root: refused', () => {
  assert.equal(msg('<a/><![CDATA[x]]>'), 'Extra content at the end of the document: text after the root element <a>. (line 1, column 5)');
});
await test('valid: declaration, DOCTYPE, comments and PI around one root', () => {
  assert.equal(msg('<?xml version="1.0"?>\n<!DOCTYPE a [<!ELEMENT a ANY>]>\n<!-- c --><a><b/><c>x</c><!-- <d/> --><![CDATA[<e/>]]></a>\n<!-- end --><?pi x?>\n'), '');
});
await test('valid: nested self-closed and paired tags', () => {
  assert.equal(msg('<root><p id="1"/><p id="2">t</p><q><r/></q></root>'), '');
});
await test('other errors keep the validator message', () => {
  assert.equal(msg('<a>\n  <b>&</b>\n</a>'), "char '&' is not expected. (line 2, column 6)");
  assert.equal(msg('<a></a>text'), 'Extra text at the end (line 1, column 8)');
});
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
