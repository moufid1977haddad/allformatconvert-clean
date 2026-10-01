// P23: time WebKit / Chromium / Firefox take to show N characters in a read-only textarea: one long line (Base64) or
// short lines (CSV, text from a PDF). Usage: node scripts/p23/textarea-cost.mjs [--lines]
import { chromium, firefox, webkit } from '@playwright/test';
const lines = process.argv.includes('--lines');
for (const [name, eng] of Object.entries({ webkit, chromium, firefox })) {
  const b = await eng.launch(); const p = await b.newPage();
  await p.setContent('<textarea readonly style="width:600px;height:190px;font:12px monospace;resize:none"></textarea>');
  const out = [];
  for (const n of [100e3, 300e3, 1e6, 3e6]) {
    const ms = await p.evaluate(async ([n, lines]) => {
      const t = document.querySelector('textarea'); t.value = '';
      const row = 'a,b,c,1234,hello world,'.repeat(3) + String.fromCharCode(10);
      const s = lines ? row.repeat(Math.round(n / row.length)) : 'QUJD'.repeat(n / 4);
      const t0 = performance.now(); t.value = s; t.getBoundingClientRect(); void t.scrollHeight;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return Math.round(performance.now() - t0);
    }, [n, lines]);
    out.push(`${n / 1000}k=${ms}ms`);
  }
  console.log(name, lines ? '(lines)' : '(one line)', out.join(' ')); await b.close();
}
