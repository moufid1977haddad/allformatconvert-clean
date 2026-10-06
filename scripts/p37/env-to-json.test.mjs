// P37 lot 1 — .env to JSON: the downloaded file is named after what it holds. Before: always env.json, also for the
// .env lines of "JSON to .env". A leading-dot name (".env") is not offered: Chrome and Firefox strip leading dots from
// download names (no hidden files), so the .env result is variables.env, to rename.
// The name logic lives in env-to-json/downloadName.js, used by the page; the page must not hard-code a name.
// Run: node scripts/p37/env-to-json.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { dotenvToJson, jsonToDotenv } = await import(new URL('../../app/lib/dotenv.js', import.meta.url));

let passed = 0, failed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { failed++; console.log('  FAIL', name, '\n   ', String(e.message).split('\n').slice(0, 4).join('\n    ')); } };
const page = readFileSync(new URL('../../app/tools/developer-tools/env-to-json/page.jsx', import.meta.url), 'utf8');
let downloadName = null;
try { ({ downloadName } = await import(new URL('../../app/tools/developer-tools/env-to-json/downloadName.js', import.meta.url))); }
catch (e) { console.log('  (module missing before the fix: ' + e.code + ')'); }
// what the page offers for a direction: the module's answer, or the hard-coded name found in the page before the fix
const offered = (dir) => downloadName ? downloadName(dir) : (/<TextDownload[^>]*name="([^"]+)"/.exec(page) || [])[1];

test('.env to JSON: env.json, and the content is JSON', () => {
  assert.equal(offered('json'), 'env.json');
  JSON.parse(dotenvToJson('A=1').json);
});
test('JSON to .env: a .env file name, not env.json', () => {
  assert.equal(offered('env'), 'variables.env');
  assert.equal(jsonToDotenv('{"A":"1"}').trim(), 'A=1');
});
test('the page passes the current direction to the name (no fixed name left)', () => {
  assert.ok(!/<TextDownload[^>]*name="/.test(page), 'TextDownload still has a fixed name');
  assert.match(page, /<TextDownload[^>]*name=\{downloadName\(direction\)\}/);
});
test('an unknown direction throws (no silent default)', () => {
  assert.ok(downloadName, 'no module');
  assert.throws(() => downloadName('xml'));
});
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
