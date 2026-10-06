// P37 lot 1 (audio / video): loads a repo file either from the working tree, or as it was at a git revision when
// SRC_REV is set (SRC_REV=HEAD shows the behavior before the fix). Used by scripts/p37/*.test.mjs of this lot.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REV = process.env.SRC_REV || '';

/** Text of a repo file (relative path with forward slashes). */
export function source(rel) {
  if (!REV) return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  return execFileSync('git', ['show', `${REV}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
}

/** Imports a dependency-free ES module of the repo (copied to a temp .mjs when SRC_REV is set). */
export async function load(rel) {
  if (!REV) return import(pathToFileURL(path.join(ROOT, rel)).href);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p37-lot1-'));
  const file = path.join(dir, path.basename(rel).replace(/\.[jt]sx?$/, '.mjs'));
  fs.writeFileSync(file, source(rel));
  return import(pathToFileURL(file).href);
}

let failures = 0;
export function check(label, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
}
export function done(name) {
  console.log(`\n${name} [${REV ? `rev ${REV}` : 'working tree'}]: ${failures ? `${failures} FAIL` : 'all PASS'}`);
  process.exitCode = failures ? 1 : 0;
}
