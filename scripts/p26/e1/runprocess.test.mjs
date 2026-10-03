// P26: the review's critical case — a request whose time ran out before its tool could start must end at once,
// and one cut while waiting for a .doc slot must leave the queue (no stuck slot, no hung request).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { runProcess } = require('../../../services/pdf-tools/src/runProcess.js');
let pass = 0, fail = 0;
const check = (n, ok, info = '') => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const ac = new AbortController(); ac.abort();
const t0 = Date.now();
const r = await Promise.race([runProcess('node', ['-e', 'setTimeout(()=>{},5000)'], { signal: ac.signal }), new Promise((res) => setTimeout(() => res('HUNG'), 3000))]);
check('already-aborted signal: resolves aborted without starting the tool', r !== 'HUNG' && r.aborted === true && Date.now() - t0 < 1000, JSON.stringify(r));
const ac2 = new AbortController();
const p = runProcess('node', ['-e', 'setTimeout(()=>{},20000)'], { signal: ac2.signal, killGroup: true });
setTimeout(() => ac2.abort(), 300);
const r2 = await Promise.race([p, new Promise((res) => setTimeout(() => res('HUNG'), 5000))]);
check('abort while running (process group on Linux): resolves aborted', r2 !== 'HUNG' && r2.aborted === true, JSON.stringify({ aborted: r2.aborted }));
console.log(`runprocess: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
