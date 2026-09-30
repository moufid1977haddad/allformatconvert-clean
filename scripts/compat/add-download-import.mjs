// Adds (or completes) `import { ... } from '<relative>/components/FileDownload'` in the given files, with the names each
// file actually uses (FileDownload, DownloadGroup, TextDownload). Usage: node scripts/compat/add-download-import.mjs <files…>
import fs from 'node:fs';
import path from 'node:path';

for (const file of process.argv.slice(2)) {
  let s = fs.readFileSync(file, 'utf8');
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  const body = s.replace(/^import .*$/gm, '');
  const names = ['FileDownload', 'DownloadGroup', 'TextDownload'].filter((n) => new RegExp(`<${n}\\b`).test(body));
  const rel = path.relative(path.dirname(file), 'app/components/FileDownload').replace(/\\/g, '/');
  const from = rel.startsWith('.') ? rel : './' + rel;
  const line = `import { ${names.join(', ')} } from '${from}';`;
  const re = /^import \{[^}]*\} from '[^']*components\/FileDownload';\r?$/m;
  if (re.test(s)) s = s.replace(re, line);
  else if (names.length) {
    const lines = s.split(nl);
    let last = -1;
    for (let i = 0; i < Math.min(lines.length, 80); i++) if (/^import .* from ['"].*['"];?\s*$/.test(lines[i])) last = i;
    lines.splice(last + 1, 0, line);
    s = lines.join(nl);
  }
  fs.writeFileSync(file, s);
  console.log(file, names.join(','));
}
