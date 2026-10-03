// P26: what pdf-tools answers TODAY for the requests the site already sends (PDF/A 1b/2b/3b, Repair, Compress),
// saved so the same requests after the service change can be compared file by file (compare-pdfs.mjs).
//   node scripts/p26/with-pdftools-key.mjs PDFTOOLS_KEY node scripts/p26/pdftools-old-behaviour.mjs <in-dir> <out-dir>
import fs from 'node:fs';
import path from 'node:path';

const [inDir, outDir] = process.argv.slice(2);
const url = process.env.PDFTOOLS_LIVE_URL, key = process.env.PDFTOOLS_KEY;
fs.mkdirSync(outDir, { recursive: true });
const health = await fetch(`${url}/health`).then((r) => r.json());
console.log('health', JSON.stringify(Object.fromEntries(Object.entries(health.binaries).map(([k, v]) => [k, v.ok ? v.version : v.detail]))));
async function post(route, file, fields) {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(file)]), path.basename(file));
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const r = await fetch(url + route, { method: 'POST', headers: { 'X-API-Key': key }, body: fd, signal: AbortSignal.timeout(240000) });
  return { status: r.status, type: r.headers.get('content-type') || '', buf: Buffer.from(await r.arrayBuffer()) };
}
for (const name of fs.readdirSync(inDir).filter((f) => f.endsWith('.pdf')).sort()) {
  const f = path.join(inDir, name), base = name.replace(/\.pdf$/, '');
  for (const lvl of ['1b', '2b', '3b']) {
    const r = await post('/v1/pdfa', f, { conformance: lvl });
    const j = JSON.parse(r.buf.toString('utf8'));
    if (j.file) fs.writeFileSync(path.join(outDir, `${base}-pdfa-${lvl}.pdf`), Buffer.from(j.file, 'base64'));
    console.log(`pdfa ${lvl} ${name} -> ${r.status} ${j.conformance} compliant=${j.compliant} rules=${j.verapdf?.passedRules}`);
  }
  const rp = await post('/v1/repair', f, {});
  const jr = JSON.parse(rp.buf.toString('utf8'));
  if (jr.file) fs.writeFileSync(path.join(outDir, `${base}-repair.pdf`), Buffer.from(jr.file, 'base64'));
  console.log(`repair ${name} -> ${rp.status} ${jr.method}`);
  const rc = await post('/v1/compress', f, { level: 'recommended' });
  if (rc.type.includes('pdf')) fs.writeFileSync(path.join(outDir, `${base}-compress.pdf`), rc.buf);
  console.log(`compress ${name} -> ${rc.status} ${rc.type.includes('pdf') ? rc.buf.length + ' bytes' : rc.buf.toString('utf8').slice(0, 80)}`);
}
