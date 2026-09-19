// Run: node scripts/test-xlsx-default-font.mjs  (no network, no secrets)
import fs from 'node:fs';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { nameNamelessFonts } from '../lib/xlsxDefaultFont.js';

const dir = new URL('../docs/audit/fixtures-fidelite/', import.meta.url);
const fontsOf = async (buf) => {
  const xml = await (await JSZip.loadAsync(buf)).file('xl/styles.xml').async('string');
  const block = /<fonts[^>]*>([\s\S]*?)<\/fonts>/.exec(xml)[1];
  return [...block.matchAll(/<font(?:\s[^>]*)?(?:\/>|>([\s\S]*?)<\/font>)/g)].map((m) => /<name\s+val="([^"]*)"/.exec(m[1] || '')?.[1]);
};

for (const [name, expectPatched] of [['fidelite-03.xlsx', 2], ['fidelite-04.xlsx', 1]]) {
  const input = fs.readFileSync(new URL(name, dir));
  assert.ok((await fontsOf(input)).includes(undefined), `${name}: fixture should contain a nameless font`);
  const { buffer, patched } = await nameNamelessFonts(input);
  assert.equal(patched, expectPatched, `${name}: patched count`);
  assert.deepEqual((await fontsOf(buffer)).filter((n) => !n), [], `${name}: no nameless font left`);
  assert.equal((await fontsOf(buffer))[0], 'Calibri');
  const again = await nameNamelessFonts(buffer);
  assert.equal(again.patched, 0, `${name}: idempotent`);
  assert.equal(Buffer.compare(again.buffer, buffer), 0, `${name}: second pass is byte-identical`);
}
// Non-xlsx bytes must throw (the route logs and converts the original).
await assert.rejects(() => nameNamelessFonts(Buffer.from('not a zip')));
console.log('xlsxDefaultFont: all assertions passed');
