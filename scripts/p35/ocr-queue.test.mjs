// P35 (06/10, D1) — the OCR line of pdf-tools (services/pdf-tools/src/ocrQueue.js), with fake recognitions:
// 2 at a time, 1 per visitor, places told as they change, bounds of the line, cancel and timeout.
//   node scripts/p35/ocr-queue.test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { OcrQueue } = require('../../services/pdf-tools/src/ocrQueue.js');

let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : info); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. eight requests from four visitors at once (A×3, B×2, C, D, E): never more than 2 running, never 2 of one visitor
{
  const q = new OcrQueue({ max: 2, maxWaiting: 20, maxWaitingPerKey: 2 });
  let running = 0, peak = 0;
  const byKey = new Map(); let keyPeak = 0;
  const order = [];
  const positions = {};
  const job = async (key, id) => {
    positions[id] = [];
    const s = await q.acquire(key, { maxWaitMs: 5000, onPosition: (n) => positions[id].push(n) });
    if (!s.ok) return { id, reason: s.reason };
    running++; peak = Math.max(peak, running);
    byKey.set(key, (byKey.get(key) || 0) + 1); keyPeak = Math.max(keyPeak, byKey.get(key));
    order.push(id);
    await sleep(40);
    running--; byKey.set(key, byKey.get(key) - 1);
    s.release();
    return { id, ok: true, waited: s.waited };
  };
  const ids = [['A', 'a1'], ['A', 'a2'], ['B', 'b1'], ['A', 'a3'], ['C', 'c1'], ['A', 'a4'], ['B', 'b2'], ['D', 'd1'], ['E', 'e1']];
  const out = await Promise.all(ids.map(([k, id]) => job(k, id)));
  check('1a at most 2 recognitions at a time', peak === 2, `peak ${peak}`);
  check('1b never 2 at a time for one visitor', keyPeak === 1, `key peak ${keyPeak}`);
  // a4 is A's fourth request while a2 and a3 already wait: a visitor may have 2 requests waiting at most
  check('1c a visitor can have at most 2 requests waiting (a 3rd waiting one is refused)', out.find((o) => o.id === 'a4').reason === 'visitor_line_full', JSON.stringify(out.find((o) => o.id === 'a4')));
  check('1d everyone else served', out.filter((o) => o.ok).length === 8, JSON.stringify(out));
  // a1, b1 start; when a1 ends, a2 (first in line) starts; when b1 ends, a3 cannot (A busy): c1 starts; and so on
  check('1e first come first served, a request waiting for its own visitor does not block the others', order.join() === 'a1,b1,a2,c1,a3,b2,d1,e1', order.join());
  check('1f places told and only decreasing', Object.entries(positions).every(([, p]) => p.every((n, i) => i === 0 || n < p[i - 1])), JSON.stringify(positions));
  check('1g each waiting request is told its place on arrival (a2: 1, a3: 2, c1: 3)', positions.a2[0] === 1 && positions.a3[0] === 2 && positions.c1[0] === 3, JSON.stringify(positions));
  check('1h nothing left running or waiting', q.stats().running === 0 && q.stats().waiting === 0, JSON.stringify(q.stats()));
}

// 2. bounds: line full, timeout, cancel
{
  const q = new OcrQueue({ max: 1, maxWaiting: 2, maxWaitingPerKey: 2 });
  const first = await q.acquire('k1', { maxWaitMs: 1000 });
  const w1 = q.acquire('k2', { maxWaitMs: 60 });
  const ac = new AbortController();
  const w2 = q.acquire('k3', { maxWaitMs: 5000, signal: ac.signal });
  const full = await q.acquire('k4', { maxWaitMs: 1000 });
  check('2a line full (maxWaiting) refused at once', full.ok === false && full.reason === 'line_full', JSON.stringify(full));
  const t = await w1;
  check('2b a wait beyond maxWaitMs ends with "timeout"', t.ok === false && t.reason === 'timeout', JSON.stringify(t));
  ac.abort();
  const a = await w2;
  check('2c a cancelled wait leaves the line ("aborted")', a.ok === false && a.reason === 'aborted' && q.stats().waiting === 0, JSON.stringify([a, q.stats()]));
  first.release();
  first.release(); // twice: counted once
  check('2d release is idempotent', q.stats().running === 0, JSON.stringify(q.stats()));
  const pre = new AbortController(); pre.abort();
  const already = await q.acquire('k5', { maxWaitMs: 1000, signal: pre.signal });
  check('2e an already-cancelled request does not start', already.ok === false && already.reason === 'aborted');
}

// 3. no key (a caller before P35): bound by the total only, as in P33
{
  const q = new OcrQueue({ max: 2, maxWaiting: 20, maxWaitingPerKey: 2 });
  const a = await q.acquire(null, { maxWaitMs: 100 });
  const b = await q.acquire(null, { maxWaitMs: 100 });
  check('3a two requests without key run together', a.ok && b.ok);
  a.release(); b.release();
}

// 4. a cancelled request in the middle of the line: the ones behind move up
{
  const q = new OcrQueue({ max: 1, maxWaiting: 20, maxWaitingPerKey: 2 });
  const s = await q.acquire('x', { maxWaitMs: 1000 });
  const pos = [];
  const ac = new AbortController();
  const m = q.acquire('y', { maxWaitMs: 1000, signal: ac.signal });
  const last = q.acquire('z', { maxWaitMs: 1000, onPosition: (n) => pos.push(n) });
  ac.abort(); await m;
  check('4a the request behind a cancelled one moves from 2 to 1', pos.join() === '2,1', pos.join());
  s.release();
  const l = await last;
  check('4b and then starts', l.ok === true);
  l.release();
}

console.log(`\n${passes} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);
