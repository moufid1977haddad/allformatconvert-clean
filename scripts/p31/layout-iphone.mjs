// P31 point 8 (03/10) — touch display on iPhone, in WebKit, at 390 × 844 (iPhone 12-16) and 375 × 667 (iPhone SE),
// over the homepage, /tools, the 12 category pages and every tool page. Extends scripts/browser-tests/p21-layout.mjs
// (375 px iPhone + iPad, 02/10). Run it against a LOCAL build only (next build && next start -p 3313), never www or a
// preview (Vercel fair-use rule, 03/10).
//   1. no horizontal overflow: document.documentElement.scrollWidth > clientWidth (or > the screen width), or
//      body.scrollWidth > body.clientWidth -> fail; the widest offending element (and the deepest ones) is reported;
//   2. touch targets of at least 44 px (Apple's minimum) in the page's own content (<main>, the help text below it,
//      [data-seo-content], excluded): visible buttons, links styled as buttons, selects, inputs (a visually hidden
//      file input is skipped), checkboxes / radios through their label, sliders. An invisible ::before / ::after hit
//      area (globals.css, buttons laid over thumbnails) counts. The global navbar and footer are measured too but
//      reported separately (they are not part of the tool).
// Usage: node scripts/p31/layout-iphone.mjs [origin=http://localhost:3313] [--viewport=390|375|both] [--only=slug,slug]
//        [--json=out.json] [--workers=4]
import { webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3313').origin;
if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(origin).hostname)) {
  console.error('Local build only (Vercel fair-use rule): give a localhost origin.');
  process.exit(2);
}
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const only = (arg('only') || '').split(',').filter(Boolean);
const workers = Number(arg('workers') || 4);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';
const VIEWPORTS = { 390: { width: 390, height: 844 }, 375: { width: 375, height: 667 } };
const vps = (arg('viewport') || 'both') === 'both' ? ['390', '375'] : [arg('viewport')];
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');

// pages: the same tree the sitemap walks (app/sitemap.ts)
const pages = ['/', '/tools'];
const toolsDir = path.join(ROOT, 'app', 'tools');
for (const cat of fs.readdirSync(toolsDir)) {
  const cdir = path.join(toolsDir, cat);
  if (!fs.statSync(cdir).isDirectory()) continue;
  pages.push(`/tools/${cat}`);
  for (const t of fs.readdirSync(cdir)) {
    const d = path.join(cdir, t);
    if (fs.statSync(d).isDirectory() && fs.readdirSync(d).some((f) => /^page\./.test(f))) pages.push(`/tools/${cat}/${t}`);
  }
}
const list = only.length ? pages.filter((p) => only.includes(p.split('/').pop() || '/') || only.includes(p)) : pages;

function measure(vw) {
  const W = vw;
  const out = { coarse: matchMedia('(pointer: coarse)').matches, overflow: null, small: [], chrome: [], checked: 0 };
  const de = document.documentElement;
  const body = document.body;
  const desc = (el) => {
    const t = (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 4).join('.') : '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} "${t}"`;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0 && r.width > 0 && r.height > 0;
  };
  const hiddenVisually = (el) => {
    // sr-only / clipped / 1 px file inputs, or anything inside an element clipped that way
    for (let e = el; e && e !== body; e = e.parentElement) {
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      if (e.classList.contains('sr-only') || (s.position === 'absolute' && (s.clip === 'rect(0px, 0px, 0px, 0px)' || s.clipPath === 'inset(50%)')) || (r.width <= 2 && r.height <= 2)) return true;
    }
    return false;
  };
  const sw = de.scrollWidth, cw = de.clientWidth, bsw = body.scrollWidth, bcw = body.clientWidth;
  if (sw > cw + 1 || sw > W + 1 || bsw > bcw + 1) {
    const off = [];
    for (const el of body.querySelectorAll('*')) {
      // an invisible (opacity 0, visibility hidden) box still widens the page: only display:none / empty boxes are skipped
      { const rr = el.getBoundingClientRect(); if (getComputedStyle(el).display === 'none' || (rr.width === 0 && rr.height === 0)) continue; }
      const s = getComputedStyle(el);
      if (s.position === 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 || r.left < -1) off.push({ el, r });
    }
    // the deepest offenders: no offending descendant
    const set = new Set(off.map((o) => o.el));
    const leaves = off.filter((o) => ![...o.el.querySelectorAll('*')].some((c) => set.has(c)));
    const widest = off.slice().sort((a, b) => b.r.width - a.r.width)[0];
    leaves.sort((a, b) => b.r.right - a.r.right);
    out.overflow = {
      sw, cw, bsw, bcw,
      widest: widest ? `${desc(widest.el)} w=${Math.round(widest.r.width)} right=${Math.round(widest.r.right)}` : null,
      leaves: leaves.slice(0, 4).map((o) => `${desc(o.el)} left=${Math.round(o.r.left)} right=${Math.round(o.r.right)} w=${Math.round(o.r.width)}`),
    };
  }
  const main = document.querySelector('main') || body;
  const seo = main.querySelector('[data-seo-content]');
  const SEL = 'button, select, input:not([type=hidden]), textarea, [role=button], a[class*="bg-"], a[class*="rounded"], a[class*="border"], a[class*="px-"]';
  const size = (el) => {
    let r = el.getBoundingClientRect();
    if (el.type === 'checkbox' || el.type === 'radio') {
      const lab = el.closest('label') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || (el.nextElementSibling && el.nextElementSibling.tagName === 'LABEL' ? el.nextElementSibling : null);
      if (lab) { const lr = lab.getBoundingClientRect(); r = { width: Math.max(lr.right, r.right) - Math.min(lr.left, r.left), height: Math.max(lr.bottom, r.bottom) - Math.min(lr.top, r.top) }; }
    }
    if (el.type === 'file') {
      const lab = el.closest('label') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`));
      if (lab) r = lab.getBoundingClientRect();
    }
    let w = r.width, h = r.height;
    for (const pseudo of ['::after', '::before']) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content !== 'none' && ps.position === 'absolute') {
        // the pseudo's own box (its offsets resolve against the element, globals.css .touch-hit / .absolute buttons)
        const pw = parseFloat(ps.width), ph = parseFloat(ps.height);
        if (pw > 0 && ph > 0) { w = Math.max(w, pw); h = Math.max(h, ph); }
        else {
          const ext = (v) => Math.max(0, -parseFloat(v || '0') || 0);
          w = Math.max(w, r.width + ext(ps.left) + ext(ps.right)); h = Math.max(h, r.height + ext(ps.top) + ext(ps.bottom));
        }
      }
    }
    return { w, h };
  };
  const check = (root, bucket, filter) => {
    for (const el of root.querySelectorAll(SEL)) {
      if (filter && !filter(el)) continue;
      if (el.tagName === 'TEXTAREA') continue; // big by nature
      if (el.type === 'file' && hiddenVisually(el) && !(el.closest('label') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)))) continue;
      if (el.type !== 'file' && el.type !== 'checkbox' && el.type !== 'radio' && (!visible(el) || hiddenVisually(el))) continue;
      if ((el.type === 'checkbox' || el.type === 'radio') && !visible(el) && !el.closest('label')) continue;
      if (el.type === 'file' && !visible(el) && !el.closest('label')) continue;
      // a visually hidden checkbox inside a visible label: the label is the target
      if ((el.type === 'checkbox' || el.type === 'radio') && !visible(el.closest('label') || el)) continue;
      const { w, h } = size(el);
      if (bucket === out.small) out.checked++;
      if (Math.min(w, h) < 43.5) bucket.push(`${desc(el)} ${Math.round(w)}×${Math.round(h)}`);
    }
  };
  check(main, out.small, (el) => !(seo && seo.contains(el)));
  for (const c of document.querySelectorAll('body > header, body > nav, body > footer, header, footer, nav')) {
    if (main.contains(c)) continue;
    check(c, out.chrome);
  }
  out.chrome = [...new Set(out.chrome)];
  return out;
}

// Second state, on pages with an upload: a small sample file is given to the tool's file input (the options of most
// file tools only appear once a file is there). Nothing leaves the machine: every /api/ call and every request to
// another host is aborted, and the convert button is never pressed.
const FIX = path.join(ROOT, 'scripts', 'audit', 'fixtures', 'files');
const fixtures = Object.fromEntries(fs.readdirSync(FIX).filter((f) => f.startsWith('sample.')).map((f) => [f.slice(7), path.join(FIX, f)]));
const MIME = { image: 'png', video: 'mp4', audio: 'wav', text: 'txt', 'application/pdf': 'pdf', 'application/json': 'json', 'text/csv': 'csv', 'application/zip': 'zip', 'application/epub+zip': 'epub' };
function pickFixture(accept) {
  const toks = (accept || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  for (const t of toks) {
    if (t.startsWith('.') && fixtures[t.slice(1)]) return fixtures[t.slice(1)];
    if (MIME[t] && fixtures[MIME[t]]) return fixtures[MIME[t]];
    const sub = t.split('/')[1];
    if (sub && fixtures[sub]) return fixtures[sub];
    const top = t.split('/')[0];
    if (MIME[top] && fixtures[MIME[top]]) return fixtures[MIME[top]];
  }
  for (const t of toks) { // .mp3, .flac, .mkv... -> a sample of the same family
    const e = t.replace(/^\./, '');
    if (/^(mp3|m4a|aac|ogg|oga|opus|flac|aiff?|wma|amr)$/.test(e)) return fixtures.wav;
    if (/^(mkv|m4v|3gp|flv|wmv|mpe?g|ts|ogv)$/.test(e)) return fixtures.mp4;
    if (/^(jpe?g|avif|jfif|cr2|nef|arw|dng|psd)$/.test(e)) return fixtures.jpg;
  }
  return toks.length ? null : fixtures.png;
}

const b = await webkit.launch();
const rows = [];
const summary = {};
const local = new URL(origin).host;
for (const vp of vps) {
  const ctxOpts = { viewport: VIEWPORTS[vp], userAgent: UA, hasTouch: true, isMobile: true, deviceScaleFactor: 3 };
  const queue = [...list];
  const res = [];
  const run = async () => {
    const ctx = await b.newContext(ctxOpts);
    await ctx.route('**/*', (r) => { const u = new URL(r.request().url()); return (u.host !== local || u.pathname.startsWith('/api/')) && /^https?:$/.test(u.protocol) ? r.abort() : r.continue(); });
    while (queue.length) {
      const url = queue.shift();
      const row = { url, vp };
      // a fresh tab per page: the site's beforeunload warning (a file is loaded) and leftover workers of the previous
      // tool never hold the next navigation
      const p = await ctx.newPage();
      p.on('dialog', (d) => d.dismiss().catch(() => {}));
      try {
        await p.goto(`${origin}${url}`, { waitUntil: 'load', timeout: 90000 });
        await p.waitForTimeout(800);
        Object.assign(row, await p.evaluate(measure, Number(vp)));
        const input = await p.$('main input[type=file]:not([data-seo-content] *)');
        if (input) {
          const fx = pickFixture(await input.getAttribute('accept'));
          row.fixture = fx ? path.basename(fx) : null;
          if (fx) {
            await input.setInputFiles(fx);
            // the tool reads the file (pdf.js, wasm decoders...): measure once <main> has not changed for 1.5 s (max 20 s)
            await p.waitForTimeout(1000);
            await p.waitForFunction(() => {
              const m = document.querySelector('main'); const h = m ? m.innerHTML.length + ':' + m.querySelectorAll('*').length : '';
              const now = Date.now();
              if (window.__p31h !== h) { window.__p31h = h; window.__p31t = now; }
              return now - window.__p31t > 1500;
            }, null, { timeout: 20000, polling: 250 }).catch(() => { row.unsettled = true; });
            row.loaded = await p.evaluate(measure, Number(vp));
          }
        }
      } catch (e) { row.error = String(e).slice(0, 160); }
      await p.close({ runBeforeUnload: false }).catch(() => {});
      res.push(row);
    }
    await ctx.close();
  };
  await Promise.all(Array.from({ length: workers }, run));
  res.sort((a, c) => list.indexOf(a.url) - list.indexOf(c.url));
  let over = 0, small = 0, chrome = 0, errs = 0, coarse = true, checked = 0, loadedPages = 0;
  const noFixture = [];
  for (const r of res) {
    if (r.error) { errs++; console.log(`ERROR [${vp}] ${r.url}: ${r.error}`); }
    if (r.coarse === undefined) continue;
    if (!r.coarse) coarse = false;
    checked += r.checked + (r.loaded?.checked || 0);
    if (r.loaded) loadedPages++;
    if (r.fixture === null) noFixture.push(r.url.split('/').pop());
    let o = false, sm = false;
    for (const [state, m] of [['initial', r], ['file loaded', r.loaded]]) {
      if (!m) continue;
      if (m.overflow) { o = true; console.log(`OVERFLOW [${vp}] (${state}) ${r.url}: html ${m.overflow.sw}/${m.overflow.cw} body ${m.overflow.bsw}/${m.overflow.bcw}; widest ${m.overflow.widest}; deepest: ${m.overflow.leaves.join(' | ')}`); }
      if (m.small.length) { sm = true; console.log(`SMALL [${vp}] (${state}) ${r.url}: ${m.small.length}: ${m.small.slice(0, 6).join('; ')}`); }
    }
    over += o; small += sm;
    if (r.chrome.length || r.loaded?.chrome.length) chrome++;
  }
  const chromeAll = [...new Set(res.flatMap((r) => [...(r.chrome || []), ...(r.loaded?.chrome || [])]))];
  if (chromeAll.length) console.log(`NAV/FOOTER [${vp}] small targets on ${chrome} pages, distinct: ${chromeAll.slice(0, 20).join('; ')}`);
  const unsettled = res.filter((r) => r.unsettled).map((r) => r.url.split('/').pop());
  if (unsettled.length) console.log(`STILL CHANGING after 20 s [${vp}] (measured anyway; a progress display or animation): ${unsettled.join(', ')}`);
  if (noFixture.length) console.log(`NO FIXTURE [${vp}] (initial state only): ${noFixture.join(', ')}`);
  summary[vp] = { pages: res.length, loadedPages, targetsChecked: checked, overflowFails: over, smallTargetFails: small, navFooterPages: chrome, errors: errs, pointerCoarse: coarse };
  rows.push(...res);
}
await b.close();
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(rows, null, 1));
for (const [vp, s] of Object.entries(summary)) console.log(`SUMMARY ${vp}px: ${s.pages} pages (${s.loadedPages} also with a file loaded), ${s.targetsChecked} tool targets measured, ${s.overflowFails} overflow fail(s), ${s.smallTargetFails} small-target fail(s), nav/footer small on ${s.navFooterPages} page(s), ${s.errors} error(s), pointer:coarse=${s.pointerCoarse}`);
const bad = Object.values(summary).some((s) => s.overflowFails || s.smallTargetFails || s.errors);
process.exit(bad ? 1 : 0);
