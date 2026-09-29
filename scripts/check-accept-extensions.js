// Build guard (30/09, real Safari 17.6): a file picker's `accept` must never list a double extension such as
// ".tar.gz", ".tar.bz2", ".part1.rar" or ".7z.001". Safari and the macOS/iOS pickers match a file by its LAST
// extension only, so "t.tar.gz" was refused by Tar Extractor ("One or more files could not be selected") while
// "t.tgz" passed. List the single extension (".gz") and the MIME types instead.
// Scans every accept="..." / accept: '...' / accept={`...`} string and every *_ACCEPT constant under app/.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'app');
const bad = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
    if (!/\.(jsx?|tsx?|mjs)$/.test(e.name)) continue;
    const src = fs.readFileSync(p, 'utf8');
    const re = /(?:\baccept\s*[=:]\s*\{?\s*|\b[A-Z_]*ACCEPT[A-Z_]*\s*=\s*)(["'`])([^"'`]*)\1/g;
    let m;
    while ((m = re.exec(src))) {
      for (const token of m[2].split(',').map((t) => t.trim())) {
        if (/^\.[^./]+\.[^./]+/.test(token)) bad.push(`${path.relative(process.cwd(), p)}: "${token}" in accept="${m[2]}"`);
      }
    }
  }
};
walk(root);
if (bad.length) {
  console.error('Double extensions in file-picker accept lists (Safari refuses the file; list the last extension instead):\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log('accept lists: no double extension');
