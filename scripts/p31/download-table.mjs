// P31 (03/10): the table "tool → download path → fixed" of the report, read from the code (same scan as
// scripts/check-downloads.js). Every path below ends in app/lib/download.js (blob retyped application/octet-stream +
// download attribute): FileDownload's link, or saveBlob. Usage: node scripts/p31/download-table.mjs > out.md
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'app/tools';
const files = (dir) => fs.readdirSync(dir).filter((f) => /\.(jsx?|tsx?)$/.test(f) && !/^layout\./.test(f)).map((f) => path.join(dir, f));
const comp = (dir) => {
  const src = files(dir).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const used = [];
  for (const [re, label] of [
    [/<DownloadGroup\b/, 'DownloadGroup (ZIP: saveBlob)'], [/<FileDownload\b/, 'FileDownload'], [/<TextDownload\b/, 'TextDownload → FileDownload'],
    [/\bMediaServiceTool\b/, 'MediaServiceTool → FileDownload'], [/\bGifFromVideoTool\b/, 'GifFromVideoTool → MediaServiceTool → FileDownload'],
    [/<PdfToImages\b/, 'PdfToImages → FileDownload'], [/<DownloadReady\b/, 'DownloadReady → FileDownload'], [/<TranscriptExports\b/, 'TranscriptExports → FileDownload'],
    [/<MediaInfo\b/, 'MediaInfo → FileDownload'], [/\bsaveBlob\(/, 'saveBlob'], [/streamToDownload/, 'streamDownload (service worker, octet-stream + attachment, ZIP > in-memory cap)'],
  ]) if (re.test(src)) used.push(label);
  return { used, comingSoon: /Coming Soon/.test(src) && src.length < 8000 };
};
const noFile = fs.readFileSync('scripts/check-downloads.js', 'utf8').match(/const NO_FILE = \{([\s\S]*?)\n\};/)[1];
const rows = [];
for (const cat of fs.readdirSync(ROOT).sort()) {
  const cdir = path.join(ROOT, cat);
  if (!fs.statSync(cdir).isDirectory()) continue;
  for (const t of fs.readdirSync(cdir).sort()) {
    const dir = path.join(cdir, t);
    if (!fs.statSync(dir).isDirectory() || !fs.readdirSync(dir).some((f) => /^page\.(jsx|tsx|js)$/.test(f))) continue;
    const id = `${cat}/${t}`;
    const { used } = comp(dir);
    if (noFile.includes(`'${id}'`)) rows.push([id, 'no file made (result on the page)', '—']);
    else rows.push([id, used.join(' + ') || '?', used.length ? 'yes' : 'CHECK']);
  }
}
console.log('| Outil | Chemin de téléchargement | Corrigé (retypé octet-stream + download) |');
console.log('|---|---|---|');
for (const r of rows) console.log(`| ${r.join(' | ')} |`);
console.log(`\n${rows.length} outils : ${rows.filter((r) => r[2] === 'yes').length} corrigés, ${rows.filter((r) => r[2] === '—').length} sans fichier, ${rows.filter((r) => r[2] === 'CHECK').length} à vérifier.`);
