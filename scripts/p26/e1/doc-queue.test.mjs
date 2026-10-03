// P26: 5 simultaneous .doc requests on a service started with DOC_TIMEOUT_MS=4000 (2 run at a time): some must end
// with 504 instead of hanging, and a request sent afterwards must still be served (no slot left taken).
//   node scripts/p26/e1/doc-queue.test.mjs <url> <docx>
import fs from 'node:fs';
const [url, docx] = process.argv.slice(2);
const send = () => { const fd = new FormData(); fd.append('file', new Blob([fs.readFileSync(docx)]), 'x.docx'); return fetch(`${url}/v1/docx-to-doc`, { method: 'POST', headers: { 'X-API-Key': 'local-bench', Connection: 'close' }, body: fd }).then((r) => r.status).catch((e) => 'ERR ' + e.message); };
const t0 = Date.now();
const all = await Promise.race([Promise.all([send(), send(), send(), send(), send()]), new Promise((r) => setTimeout(() => r('HUNG'), 60000))]);
console.log('5 at once ->', JSON.stringify(all), `${Date.now() - t0} ms`);
const after = await Promise.race([send(), new Promise((r) => setTimeout(() => r('HUNG'), 30000))]);
console.log('then one more ->', after);
const ok = all !== 'HUNG' && all.every((s) => s === 200 || s === 504) && after === 200;
console.log(ok ? 'PASS doc queue: no hang, no stuck slot' : 'FAIL doc queue');
process.exit(ok ? 0 : 1);
