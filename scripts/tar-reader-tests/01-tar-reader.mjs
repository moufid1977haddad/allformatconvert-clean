// Tests for app/lib/tarReader.js against REAL archives (docs/audit/RAPPORT-outils-mis-en-avant.md):
//   pax.tar    -- Python tarfile, POSIX PAX (accented name + 142-char path in 'x' records)
//   gnu.tar    -- Python tarfile, GNU format (././@LongLink)
//   bsdtar.tar -- Windows' own C:\Windows\System32\tar.exe (bsdtar), folder + accented name
// Expected names/sizes/md5 are what Python's tarfile extracts from the same files.
// Run: node scripts/tar-reader-tests/01-tar-reader.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// The app module is plain ESM with no imports: load it by path.
const { readTar, TarFormatError } = await import(new URL('../../app/lib/tarReader.js', import.meta.url));
const md5 = (d) => crypto.createHash('md5').update(d).digest('hex').slice(0, 8);
const read = (n) => readTar(new Uint8Array(fs.readFileSync(path.join(here, 'fixtures', n)))).map((f) => [f.name, f.data.length, md5(f.data)]);
const LONG = 'projet/' + 'sous-dossier-avec-un-nom-assez-long/'.repeat(3) + 'rapport-final-version-2.txt';
const THREE = [['readme.txt', 11, '8d24a1b5'], ['résumé-été.txt', 14, '17fc8595'], [LONG, 10, 'dc6632e2']];

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e); process.exitCode = 1; } };
test('PAX: accented name and long path applied, no PaxHeader entries', () => assert.deepEqual(read('pax.tar'), THREE));
test('GNU: long name applied, no @LongLink entry', () => assert.deepEqual(read('gnu.tar'), THREE));
test('Windows tar.exe: one file, real content, folder skipped', () => assert.deepEqual(read('bsdtar.tar'), [['dossier/été.txt', 8, 'fe833206']]));
test('not a tar: clear error', () => assert.throws(() => readTar(new Uint8Array(1024).fill(65)), TarFormatError));
console.log(`${passed} passed`);
