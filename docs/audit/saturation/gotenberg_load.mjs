// Gotenberg end to end on www (point 7b, 28/09/2026): real visitors' path, /api/convert-to-pdf -> gotenberg-v2
// (LibreOffice), with the corpus' Excel and PowerPoint files (never .docx: that one goes to ConvertAPI, a paid
// provider). Waves of 1, 5, 10, 20 and 40 simultaneous requests; each one's time and status; every PDF checked
// (%PDF-). Requests carry the test-robot cookie, so a failure provoked here is never written to tool_errors.
// Usage: node docs/audit/saturation/gotenberg_load.mjs <origin> <out.json> [waves=1,5,10,20,40]
import fs from 'node:fs';
import path from 'node:path';

const [origin, out, wavesArg] = process.argv.slice(2);
const WAVES = (wavesArg || '1,5,10,20,40').split(',').map(Number);
const FILES = ['fidelite-03.xlsx', 'fidelite-04.xlsx', 'fidelite-05.pptx', 'fidelite-06.pptx'].map((f) => path.resolve('docs/audit/fixtures-fidelite', f));
const MIME = { xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };

async function one(file, i) {
  const t0 = Date.now();
  const fd = new FormData();
  const ext = file.split('.').pop();
  fd.append('file', new Blob([fs.readFileSync(file)], { type: MIME[ext] }), `load-${i}-${path.basename(file)}`);
  try {
    const r = await fetch(`${origin}/api/convert-to-pdf`, { method: 'POST', body: fd, headers: { Cookie: 'oct_automation=1', 'User-Agent': 'onlineconvertools-load-test/28-09' } });
    const buf = Buffer.from(await r.arrayBuffer());
    return { file: path.basename(file), status: r.status, s: (Date.now() - t0) / 1000, pdf: buf.subarray(0, 5).toString() === '%PDF-', bytes: buf.length };
  } catch (e) {
    return { file: path.basename(file), status: 0, s: (Date.now() - t0) / 1000, error: String(e).slice(0, 120) };
  }
}

const report = { origin, at: new Date().toISOString(), waves: [] };
for (const n of WAVES) {
  const t0 = Date.now();
  const res = await Promise.all(Array.from({ length: n }, (_, i) => one(FILES[i % FILES.length], i)));
  const times = res.map((r) => r.s).sort((a, b) => a - b);
  const ok = res.filter((r) => r.status === 200 && r.pdf).length;
  const wave = { n, ok, failed: n - ok, statuses: [...new Set(res.map((r) => r.status))], median_s: times[Math.floor(n / 2)], p90_s: times[Math.floor(n * 0.9)] ?? times.at(-1), max_s: times.at(-1), wall_s: (Date.now() - t0) / 1000, res };
  report.waves.push(wave);
  console.log(JSON.stringify({ n, ok, failed: wave.failed, statuses: wave.statuses, median_s: wave.median_s, p90_s: wave.p90_s, max_s: wave.max_s }));
  await new Promise((r) => setTimeout(r, 5000));
}
fs.writeFileSync(out, JSON.stringify(report, null, 1));
console.log('written', out);
