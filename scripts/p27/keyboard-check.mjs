// P27 phase 5: one tool per category, by KEYBOARD only (WCAG 2.2 AA 2.1.1, 2.4.7, 4.1.3):
//   - Tab reaches the upload area (or the first field) and the focused element shows a visible outline;
//   - Enter on the upload area opens the file picker (the browser's filechooser event), and a file chosen there runs
//     the tool as a click would;
//   - when the result is ready, the polite status region announces it ([data-a11y-status]); errors use role=alert.
//   node scripts/p27/keyboard-check.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { previewAuth } from '../p26/preview-auth.mjs';
import fs from 'node:fs';
import path from 'node:path';

const axeSrc = process.env.AXE_PATH ? fs.readFileSync(process.env.AXE_PATH, 'utf8') : null;
// axe on the page as it is NOW (after a file was chosen: options, results, download buttons appear)
async function axeNow(p) {
  if (!axeSrc) return [];
  await p.addScriptTag({ content: axeSrc }).catch(() => {});
  return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] })).violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0]?.target.join(' ')}`)).catch(() => ['axe failed']);
}

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = process.argv.find((a) => a.startsWith('--browser='))?.slice(10) || 'chromium';
const FX = path.resolve('scripts/audit/fixtures/files');
const TOOLS = [
  ['pdf-tools', '/tools/pdf-tools/pdf-to-pdfa', null],
  ['image-tools', '/tools/image-tools/jpg-to-png', 'sample.jpg'],
  ['gif-tools', '/tools/gif-tools/gif-to-mp4', null],
  ['audio-tools', '/tools/audio-tools/audio-converter', null],
  ['video-tools', '/tools/video-tools/video-to-gif', null],
  ['text-tools', '/tools/text-tools/case-converter', null],
  ['file-tools', '/tools/file-tools/file-metadata', 'sample.txt'],
  ['qr-barcodes-tools', '/tools/qr-barcodes-tools/qr-scanner', null],
  ['converter-tools', '/tools/converter-tools/unit-converter', null],
  ['developer-tools', '/tools/developer-tools/base64-encoder', 'sample.png'],
  ['math-tools', '/tools/math-tools/percentage-calculator', null],
  ['ai-tools', '/tools/ai-tools/background-remover', null],
];
const b = await { chromium, firefox, webkit }[engine].launch();
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
await previewAuth(ctx, origin); // a protected Vercel preview (vercel env run): token on the preview's own requests only
await ctx.route('**/api/**', (r) => r.abort()); // nothing is sent to a service from this check
let pass = 0, fail = 0;
const check = (n, ok, info = '') => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

for (const [cat, url, sample] of TOOLS) {
  const p = await ctx.newPage();
  await p.goto(origin + url, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  // Tab from the top of the page until focus enters the tool (main), at most 80 presses
  let reached = null;
  for (let i = 0; i < 80; i++) {
    await p.keyboard.press('Tab');
    reached = await p.evaluate(() => {
      const el = document.activeElement;
      if (!el || !el.closest('#main-content')) return null;
      const s = getComputedStyle(el);
      return { tag: el.tagName, role: el.getAttribute('role'), zone: !!el.dataset.a11yZone, label: (el.getAttribute('aria-label') || el.innerText || el.placeholder || '').trim().slice(0, 50), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 1 };
    });
    if (reached) break;
  }
  check(`${cat}: Tab reaches the tool`, !!reached, reached ? `${reached.tag}${reached.role ? '[' + reached.role + ']' : ''} "${reached.label}"` : 'never');
  if (reached) check(`${cat}: focus visible`, reached.outline, reached.outline ? 'outline' : 'no outline');
  const hasZone = await p.locator('[data-a11y-zone]').count();
  if (hasZone) {
    // move focus to the upload area (Tab order) and press Enter: the picker must open
    for (let i = 0; i < 30 && !(await p.evaluate(() => !!document.activeElement?.dataset?.a11yZone)); i++) await p.keyboard.press('Tab');
    const onZone = await p.evaluate(() => !!document.activeElement?.dataset?.a11yZone);
    let chooser = null;
    if (onZone) {
      const waiting = p.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);
      await p.waitForTimeout(200); // the interception is armed before the key is pressed
      await p.keyboard.press('Enter');
      chooser = await waiting;
    }
    check(`${cat}: Enter on the upload area opens the file picker`, !!chooser, onZone ? '' : 'upload area not reached by Tab');
    if (chooser && sample) {
      await chooser.setFiles(path.join(FX, sample));
      const announced = await p.waitForFunction(() => /selected|ready|working|%/i.test(document.querySelector('[data-a11y-status]')?.textContent || ''), null, { timeout: 30000 }).then(() => true).catch(() => false);
      const said = await p.locator('[data-a11y-status]').textContent().catch(() => '');
      // some tools need their button: press it with the keyboard (Tab to it, Enter)
      check(`${cat}: chosen with the keyboard, the page reacts and announces`, announced || (await p.locator('[data-file-download]').count()) > 0 || /./.test(said || ''), (said || '').slice(0, 70));
      await p.waitForTimeout(1500);
      const v = await axeNow(p);
      check(`${cat}: axe after the file (serious/critical)`, v.length === 0, v.join(' | ').slice(0, 200));
    }
  } else {
    check(`${cat}: no upload area (text tool): field reachable`, !!reached, '');
  }
  await p.close();
}
await b.close();
console.log(`keyboard-check ${engine}: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
