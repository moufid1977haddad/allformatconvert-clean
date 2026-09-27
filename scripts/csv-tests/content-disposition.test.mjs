// lib/contentDisposition.js against the real Fetch Headers API (the one that threw on 26/09 in production:
// "Cannot convert argument to a ByteString", pdf-to-word, tool_errors 131-132).
// Run: node scripts/csv-tests/content-disposition.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { contentDisposition } = createRequire(import.meta.url)('../../lib/contentDisposition.js');

const names = ['Rapport d’été — «final» œuvre.pdf', 'تقرير المبيعات ٢٠٢٦.pdf', '年度报告（最终版）.pdf', 'plain "quoted" name.pdf', 'Café.docx'];
let n = 0;
for (const name of names) {
  const out = name.replace(/\.[^.]+$/, '') + '.docx';
  const old = `attachment; filename="${out.replace(/"/g, '')}"`;
  let oldThrew = false;
  try { new Headers({ 'Content-Disposition': old }); } catch { oldThrew = true; }
  const h = new Headers({ 'Content-Disposition': contentDisposition(out) }); // must not throw
  const v = h.get('content-disposition');
  const star = /filename\*=UTF-8''([^;]+)/.exec(v)[1];
  assert.equal(decodeURIComponent(star), out, 'the UTF-8 name round-trips exactly');
  assert.match(/filename="([^"]*)"/.exec(v)[1], /^[\x20-\x7e]+$/, 'ASCII fallback');
  n++;
  console.log('PASS', JSON.stringify(out), '| old header threw:', oldThrew, '| new:', v);
}
console.log(`${n} passed`);
