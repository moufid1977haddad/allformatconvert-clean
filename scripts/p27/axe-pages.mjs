// P27 phase 5: axe-core (WCAG 2.0/2.1/2.2 A and AA rules) on every page of the site -- home, /tools, every category
// and every tool page on disk, the site pages -- in Chromium, at a phone width and a computer width, light theme, then
// the same in dark theme (the site has one). Groups violations by rule and impact, with the first elements of each.
//   AXE_PATH=<path to axe-core/axe.min.js> node scripts/p27/axe-pages.mjs <origin> --out=<file.json> [--only=/a,/b]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const origin = new URL(args.find((a) => !a.startsWith('--'))).origin;
const out = opt('out');
const axeSrc = fs.readFileSync(process.env.AXE_PATH, 'utf8');
const root = path.resolve('app/tools');
const rel = ['/', '/tools', '/about', '/privacy', '/terms', '/contact'];
for (const cat of fs.readdirSync(root).sort()) {
  const cdir = path.join(root, cat); if (!fs.statSync(cdir).isDirectory()) continue;
  rel.push(`/tools/${cat}`);
  for (const t of fs.readdirSync(cdir).sort()) { const tdir = path.join(cdir, t); if (fs.statSync(tdir).isDirectory() && fs.readdirSync(tdir).some((f) => /^page\.(jsx|tsx|js)$/.test(f))) rel.push(`/tools/${cat}/${t}`); }
}
const only = opt('only') ? opt('only').split(',') : null;
const urls = rel.filter((u) => !only || only.includes(u));
const modes = (opt('modes') || 'phone-light,desktop-light,phone-dark,desktop-dark').split(',');

const b = await chromium.launch();
const results = [];
for (const mode of modes) {
  const [size, theme] = mode.split('-');
  const ctx = await b.newContext({ viewport: size === 'phone' ? { width: 390, height: 844 } : { width: 1366, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
  // the site's own theme switch is remembered in localStorage: follow the mode asked for
  await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch { /* ignored */ } }, theme);
  for (const u of urls) {
    const p = await ctx.newPage();
    try {
      await p.goto(origin + u, { waitUntil: 'load', timeout: 45000 });
      await p.waitForTimeout(700);
      await p.addScriptTag({ content: axeSrc });
      const r = await p.evaluate(async () => {
        const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
        return res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map((x) => `${x.target.join(' ')} :: ${(x.failureSummary || '').split('\n').slice(1, 2).join('').slice(0, 160)}`) }));
      });
      results.push({ mode, url: u, violations: r });
      const serious = r.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      console.log(`${mode} ${u} ${r.length} rules${serious.length ? ' | ' + serious.map((v) => `${v.impact[0]}:${v.id}(${v.n})`).join(' ') : ''}`);
    } catch (e) {
      results.push({ mode, url: u, error: String(e.message).slice(0, 200) });
      console.log(`${mode} ${u} ERROR ${String(e.message).slice(0, 120)}`);
    }
    await p.close();
    if (out) fs.writeFileSync(out, JSON.stringify(results));
  }
  await ctx.close();
}
await b.close();
const byRule = {};
for (const r of results) for (const v of r.violations || []) { const k = `${v.impact} ${v.id}`; byRule[k] = byRule[k] || { pages: 0, nodes: 0, sample: v.nodes[0], help: v.help }; byRule[k].pages++; byRule[k].nodes += v.n; }
console.log('\n== by rule (impact rule: pages, elements)');
for (const [k, v] of Object.entries(byRule).sort((a, b2) => b2[1].pages - a[1].pages)) console.log(`${k}: ${v.pages} pages, ${v.nodes} elements — ${v.help} — e.g. ${v.sample}`);
const bad = results.filter((r) => (r.violations || []).some((v) => v.impact === 'serious' || v.impact === 'critical')).length;
console.log(`\naxe: ${results.length} page-modes, ${bad} with serious/critical violations, ${results.filter((r) => r.error).length} errors`);
