// P25 (03/10, E4): turn a visitor's URL into ONE self-contained HTML document that our Chromium (Gotenberg) can print
// without making a single network request of its own.
//
// Why not hand the URL to Gotenberg (/forms/chromium/convert/url, what iLovePDF-style services do): Gotenberg runs
// on Railway next to our other services, and its Chromium would fetch the page, every resource and every redirect
// itself — none of which our SSRF rules could check. Its own guard (--chromium-deny-private-ips, Gotenberg >= 8.32)
// is off on our service and turning it on is a Railway change (plan, E4). So the page is fetched HERE, by
// safeFetch (each address resolved and checked, connection pinned, every redirect checked, time and size limits):
//   - the HTML is parsed by parse5 (the HTML standard's own algorithm); scripts and anything that could make the
//     browser load or navigate somewhere else are removed (script, iframe, object, embed, base, meta http-equiv,
//     link, template, on* handlers, javascript: links); <noscript> content is shown (scripts will not run);
//   - style sheets (with their @import), images (src, srcset, lazy-loading data-src…), fonts and CSS backgrounds are
//     fetched through the same guard and written into the document (data: URIs, <style>); every "<" of inserted CSS
//     is escaped, so a style sheet cannot close its <style> element (independent review, 03/10);
//   - the result is parsed AGAIN as Chromium will (scripting on) and refused if anything forbidden appears (a
//     parser-differential trick that the first pass let through);
//   - a Content-Security-Policy is placed FIRST in the document: Chromium may load nothing but data: and inline styles,
//     and run no script at all.
// Scripts not running is the price: a page that builds its content with JavaScript can come out incomplete — the
// visitor is told when the page looks like one (little text, many scripts).
import { parse, serialize } from 'parse5';
import { safeFetch, FetchRefused } from './safeFetch.js';

export const CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline' data:; font-src data:; media-src data:; "
  + "script-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; connect-src 'none'; "
  + "manifest-src 'none'; base-uri 'none'; form-action 'none'";

const LIMITS = { htmlBytes: 5 * 1024 * 1024, resourceBytes: 3 * 1024 * 1024, totalBytes: 25 * 1024 * 1024, resources: 150, cssChars: 2 * 1024 * 1024, cssTokens: 3000, pageMs: 15000, resourceMs: 10000, budgetMs: 40000, concurrency: 8 };

const REMOVE = new Set(['script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'portal', 'base', 'link', 'audio', 'track', 'param', 'fencedframe', 'template']);
const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'xlink:href', 'data', 'poster', 'background', 'cite', 'longdesc', 'manifest', 'codebase', 'archive', 'lowsrc', 'dynsrc', 'ping', 'srcdoc']);
const FONT_EXT = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', eot: 'application/vnd.ms-fontobject' };
const SPACE = /[\x00-\x20\x7f-\x9f]+/g;

const attr = (el, name) => el.attrs?.find((a) => a.name === name)?.value;
const setAttr = (el, name, value) => { const a = el.attrs.find((x) => x.name === name); if (a) a.value = value; else el.attrs.push({ name, value }); };
const delAttr = (el, name) => { el.attrs = el.attrs.filter((a) => a.name !== name); };
const isDangerousUrl = (v) => /^(javascript|vbscript|data:text\/html|data:application|file|blob|filesystem):/i.test(String(v).replace(SPACE, ''));
// CSS written into a <style> element: "<" can never start "</style>" (CSS accepts the escape everywhere it matters).
const escapeCss = (css) => css.replace(/</g, '\\3c ');

function decodeHtml(buf, contentType) {
  const fromHeader = /charset\s*=\s*["']?([\w.:-]+)/i.exec(contentType || '')?.[1];
  const head = buf.subarray(0, 4096).toString('latin1');
  const fromMeta = /<meta[^>]{0,500}charset\s*=\s*["']?\s*([\w.:-]+)/i.exec(head)?.[1];
  for (const label of [fromHeader, fromMeta, 'utf-8']) {
    if (!label) continue;
    try { return new TextDecoder(label).decode(buf); } catch { /* unknown label: next */ }
  }
  return buf.toString('utf8');
}

// Iterative (a page nested 100,000 levels deep must not overflow the stack).
function walk(root, fn) {
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    fn(n);
    const kids = [...(n.childNodes || []), ...(n.content?.childNodes || [])];
    for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
  }
}
// Still in the document (not inside something already removed)?
function attached(n) { for (let x = n; x; x = x.parentNode) if (x.nodeName === '#document') return true; return false; }
function removeNode(n) { const p = n.parentNode; if (!p) return; p.childNodes = p.childNodes.filter((x) => x !== n); n.parentNode = null; }
function unwrap(n) {
  const p = n.parentNode; if (!p) return;
  const i = p.childNodes.indexOf(n);
  for (const c of n.childNodes) c.parentNode = p;
  p.childNodes.splice(i, 1, ...n.childNodes);
  n.parentNode = null;
}
function textOf(root) {
  let out = '';
  walk(root, (n) => { if (n.nodeName === '#text' && !['script', 'style', 'template'].includes(n.parentNode?.nodeName)) out += n.value; });
  return out;
}

// "a.jpg 1x, b.jpg 2x" / "a.jpg 400w, b.jpg 1600w" → the candidate to print: the widest up to 2000 w, else the highest density.
export function pickSrcset(srcset) {
  const cands = String(srcset || '').slice(0, 20000).split(/,\s+(?=\S)/).map((c) => c.trim().split(/\s+/)).filter((c) => c[0]).map(([u, d = '1x']) => {
    const m = /^(\d+(?:\.\d+)?)([wx])$/i.exec(d); return { u, w: m && m[2].toLowerCase() === 'w' ? Number(m[1]) : null, x: m && m[2].toLowerCase() === 'x' ? Number(m[1]) : 1 };
  });
  if (!cands.length) return null;
  const ws = cands.filter((c) => c.w).sort((a, b) => a.w - b.w);
  if (ws.length) return (ws.filter((c) => c.w <= 2000).pop() || ws[0]).u;
  return cands.sort((a, b) => a.x - b.x).filter((c) => c.x <= 2).pop()?.u || cands[0].u;
}

const isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';
// One CSS url(...) starting at i (just after "url("): { value, end } or { fail } where fail is the first position not
// yet scanned. The scan only moves forward, so the whole style sheet is read in linear time (no backtracking regex).
function readUrlToken(css, i) {
  let j = i; while (j < css.length && isSpace(css[j])) j++;
  const q = css[j];
  if (q === '"' || q === "'") {
    let k = j + 1;
    while (k < css.length && css[k] !== q && css[k] !== '\n') k += css[k] === '\\' ? 2 : 1;
    if (css[k] !== q) return { fail: k };
    let m = k + 1; while (m < css.length && isSpace(css[m])) m++;
    return css[m] === ')' ? { value: css.slice(j + 1, k), end: m + 1 } : { fail: m };
  }
  let k = j;
  while (k < css.length && css[k] !== ')' && !isSpace(css[k]) && css[k] !== '"' && css[k] !== "'" && css[k] !== '(') k += css[k] === '\\' ? 2 : 1;
  let m = k; while (m < css.length && isSpace(css[m])) m++;
  return css[m] === ')' ? { value: css.slice(j, k), end: m + 1 } : { fail: Math.max(m, i) };
}
// Tokens of a style sheet: url(...) and @import rules, with their positions.
export function cssTokens(css, max = LIMITS.cssTokens) {
  const lower = css.toLowerCase();
  const out = [];
  let i = 0;
  // Next occurrence of each, searched again only once passed: every character is looked at a bounded number of times.
  let u = -2, im = -2;
  while (out.length < max) {
    if (u !== -1 && u < i) u = lower.indexOf('url(', i);
    if (im !== -1 && im < i) im = lower.indexOf('@import', i);
    if (u < 0 && im < 0) break;
    if (im >= 0 && (u < 0 || im < u)) {
      let j = im + 7; while (j < css.length && isSpace(css[j])) j++;
      let value = null, after = j;
      if (lower.startsWith('url(', j)) { const t = readUrlToken(css, j + 4); if (t.fail !== undefined) { i = Math.max(t.fail, im + 7); continue; } value = t.value; after = t.end; }
      else if (css[j] === '"' || css[j] === "'") {
        let k = j + 1; while (k < css.length && css[k] !== css[j] && css[k] !== '\n') k += css[k] === '\\' ? 2 : 1;
        if (css[k] !== css[j]) { i = Math.max(k, im + 7); continue; }
        value = css.slice(j + 1, k); after = k + 1;
      } else { i = im + 7; continue; }
      let e = after; while (e < css.length && e - after < 1000 && css[e] !== ';' && css[e] !== '{' && css[e] !== '}') e++;
      if (css[e] !== ';') { i = after; continue; }
      out.push({ type: 'import', start: im, end: e + 1, value, media: css.slice(after, e).trim() });
      i = e + 1;
      continue;
    }
    const t = readUrlToken(css, u + 4);
    if (t.fail !== undefined) { i = Math.max(t.fail, u + 4); continue; }
    out.push({ type: 'url', start: u, end: t.end, value: t.value });
    i = t.end;
  }
  return out;
}

// `fetcher` is safeFetch; tests hand in a stand-in that serves fixed pages (scripts/p25/snapshot.test.mjs).
// `extraCss`: rules added last in <head> (the page setup), inside the tree, so the safety check sees the final document.
/**
 * @param {string} rawUrl
 * @param {{ signal?: AbortSignal, deadline?: number, fetcher?: Function, extraCss?: string }} [opts]
 */
export async function snapshotPage(rawUrl, { signal, deadline, fetcher = safeFetch, extraCss = '' } = {}) {
  const started = Date.now();
  const end = Math.min(deadline || Infinity, started + LIMITS.budgetMs);
  const left = () => end - Date.now();
  const page = await fetcher(rawUrl, { accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1', maxBytes: LIMITS.htmlBytes, timeoutMs: Math.min(LIMITS.pageMs, Math.max(1000, left())), signal })
    .catch((e) => { if (e.code === 'too_large') throw new FetchRefused('This page is larger than 5 MB of HTML, which is more than can be converted here.', 'too_large'); if (e.code === 'timeout') throw new FetchRefused('The site took too long to answer (15 s).', 'timeout'); throw e; });
  if (page.status >= 400) throw new FetchRefused(`The site answered with an error (HTTP ${page.status}): check the address in your browser.`, 'http_error');
  const type = page.contentType.split(';')[0].trim().toLowerCase();
  const looksHtml = /^\s*<(!doctype|html|head|body|meta|title|div|p)\b/i.test(page.body.subarray(0, 2048).toString('latin1').replace(/<!--[\s\S]{0,2000}?-->/g, ''));
  if (type && type !== 'text/html' && type !== 'application/xhtml+xml' && !(type === 'text/plain' && looksHtml)) {
    throw new FetchRefused(type === 'application/pdf' ? 'This address is already a PDF file: open it and save it directly.' : `This address is not a web page (it is ${type}).`, 'not_html');
  }
  const doc = parse(decodeHtml(page.body, page.contentType), { scriptingEnabled: false });

  let base = page.url;
  walk(doc, (n) => { if (n.nodeName === 'base' && base === page.url) { const h = attr(n, 'href'); try { const b = new URL(h, page.url); if (/^https?:$/.test(b.protocol)) base = b.href; } catch { /* ignore */ } } });

  const stats = { scripts: 0, resources: 0, failed: 0, skipped: 0, bytes: 0 };
  let reserved = 0; // bytes promised to fetches in flight: the 25 MB total holds even with 8 at once (review 03/10)
  const cache = new Map();
  let active = 0; const queue = [];
  const slot = () => new Promise((res) => { if (active < LIMITS.concurrency) { active++; res(); } else queue.push(res); });
  const release = () => { const next = queue.shift(); if (next) next(); else active--; };

  // One resource through the guard → a data: URI (or the CSS text for style sheets), null when it could not be had.
  function fetchResource(abs, kind) {
    const key = `${kind}|${abs}`;
    if (cache.has(key)) return cache.get(key);
    const p = (async () => {
      if (stats.resources >= LIMITS.resources || left() < 1000) { stats.skipped++; return null; }
      stats.resources++;
      await slot();
      const allowance = Math.min(LIMITS.resourceBytes, LIMITS.totalBytes - stats.bytes - reserved);
      if (allowance < 1024 || left() < 1000) { release(); stats.skipped++; return null; }
      reserved += allowance;
      try {
        const r = await fetcher(abs, { accept: kind === 'css' ? 'text/css,*/*;q=0.1' : kind === 'font' ? '*/*' : 'image/avif,image/webp,image/*,*/*;q=0.5', maxBytes: allowance, timeoutMs: Math.min(LIMITS.resourceMs, left()), signal });
        if (r.status >= 400) { stats.failed++; return null; }
        stats.bytes += r.body.length;
        let mime = r.contentType.split(';')[0].trim().toLowerCase();
        if (kind === 'css') { const t = decodeHtml(r.body, r.contentType); return t.length > LIMITS.cssChars ? (stats.skipped++, null) : t; }
        const ext = (/\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(new URL(r.url).pathname)?.[1] || '').toLowerCase();
        if (kind === 'font' || FONT_EXT[ext]) mime = FONT_EXT[ext] || (/font|woff|opentype|truetype/.test(mime) ? mime : 'font/woff2');
        else if (!/^image\/[a-z0-9.+-]+$/.test(mime)) { // some servers send images as octet-stream: recognise the common signatures
          const b = r.body;
          mime = b[0] === 0x89 && b[1] === 0x50 ? 'image/png' : b[0] === 0xff && b[1] === 0xd8 ? 'image/jpeg' : b.subarray(0, 4).toString() === 'GIF8' ? 'image/gif'
            : b.subarray(8, 12).toString() === 'WEBP' ? 'image/webp' : /<svg[\s>]/i.test(b.subarray(0, 1024).toString()) ? 'image/svg+xml' : '';
          if (!mime) { stats.failed++; return null; }
        }
        return `data:${mime};base64,${r.body.toString('base64')}`;
      } catch { stats.failed++; return null; } finally { reserved -= allowance; release(); }
    })();
    cache.set(key, p);
    return p;
  }

  const resolve = (v, against) => { try { const u = new URL(String(v).trim(), against); return /^https?:$/.test(u.protocol) ? u.href : null; } catch { return null; } };

  async function inlineCss(css, cssBase, depth = 0) {
    if (css.length > LIMITS.cssChars) { stats.skipped++; return ''; }
    const tokens = cssTokens(css);
    const parts = await Promise.all(tokens.map(async (t) => {
      if (t.type === 'import') {
        // in place, so the cascade order is kept; a media condition wraps the imported rules
        const abs = resolve(t.value, cssBase);
        if (!abs || depth >= 4) return '';
        const text = await fetchResource(abs, 'css');
        if (text === null) return '';
        const inner = await inlineCss(text, abs, depth + 1);
        const media = t.media.replace(/\b(layer|supports)\([^)]{0,500}\)/gi, '').trim();
        return media && !/^all$/i.test(media) && /^[\w\s(),:.-]{1,300}$/.test(media) ? `@media ${media} {\n${inner}\n}` : inner;
      }
      const v = t.value.trim();
      if (!v || v.startsWith('#') || /^data:/i.test(v)) return css.slice(t.start, t.end);
      const abs = resolve(v, cssBase);
      if (!abs) return 'url("data:,")';
      const isFont = /\.(woff2?|ttf|otf|eot)(?:[?#]|$)/i.test(abs);
      const data = await fetchResource(abs, isFont ? 'font' : 'image');
      return data ? `url("${data}")` : 'url("data:,")';
    }));
    let out = ''; let at = 0;
    tokens.forEach((t, i) => { out += css.slice(at, t.start) + parts[i]; at = t.end; });
    return out + css.slice(at);
  }

  const jobs = [];
  const elements = [];
  walk(doc, (n) => { if (n.tagName) elements.push(n); });
  for (const el of elements) {
    if (!attached(el)) continue;
    const tag = el.tagName;
    if (tag === 'script') stats.scripts++;
    if (tag === 'link' && /(^|\s)stylesheet(\s|$)/i.test(attr(el, 'rel') || '') && !/(^|\s)alternate(\s|$)/i.test(attr(el, 'rel') || '')) {
      // the style sheet replaces the <link>, in place, with its media condition
      const href = resolve(attr(el, 'href'), base);
      const media = attr(el, 'media');
      const style = { nodeName: 'style', tagName: 'style', attrs: media ? [{ name: 'media', value: media }] : [], namespaceURI: el.namespaceURI, childNodes: [], parentNode: el.parentNode };
      el.parentNode.childNodes.splice(el.parentNode.childNodes.indexOf(el), 1, style);
      el.parentNode = null;
      if (href) jobs.push((async () => { const text = await fetchResource(href, 'css'); if (text !== null) style.childNodes = [{ nodeName: '#text', value: escapeCss(await inlineCss(text, href)), parentNode: style }]; })());
      continue;
    }
    if (REMOVE.has(tag)) { removeNode(el); continue; }
    if (tag === 'meta' && (attr(el, 'http-equiv') !== undefined || attr(el, 'charset') !== undefined)) { removeNode(el); continue; }
    if (tag === 'noscript') { unwrap(el); continue; }
    if (tag === 'video') { for (const c of [...el.childNodes]) if (c.tagName === 'source' || c.tagName === 'track') removeNode(c); delAttr(el, 'src'); }
    if (tag === 'source' && el.parentNode?.tagName === 'picture') {
      const img = el.parentNode.childNodes.find((c) => c.tagName === 'img');
      if (img && !attr(img, 'src') && !attr(img, 'data-src') && attr(el, 'srcset')) setAttr(img, 'data-src', pickSrcset(attr(el, 'srcset')) || '');
      removeNode(el); continue;
    }
    if (tag === 'source') { removeNode(el); continue; }
    // attributes: handlers out, dangerous URLs out, the rest made absolute
    for (const a of [...el.attrs]) {
      if (/^on/i.test(a.name) || a.name === 'srcdoc' || a.name === 'ping' || a.name === 'formaction' || a.name === 'nonce' || a.name === 'integrity') { delAttr(el, a.name); continue; }
      if (URL_ATTRS.has(a.name) && isDangerousUrl(a.value)) delAttr(el, a.name);
    }
    if (tag === 'a' || tag === 'area') {
      const h = attr(el, 'href');
      if (h && !h.startsWith('#')) { const abs = /^(mailto|tel):/i.test(h) ? h : resolve(h, base); if (abs) setAttr(el, 'href', abs); else delAttr(el, 'href'); }
      delAttr(el, 'target');
    }
    if (tag === 'form') delAttr(el, 'action');
    if (tag === 'img' || (tag === 'input' && /^image$/i.test(attr(el, 'type') || ''))) {
      const lazy = attr(el, 'data-src') || attr(el, 'data-lazy-src') || attr(el, 'data-original') || attr(el, 'data-lazy') || pickSrcset(attr(el, 'data-srcset') || attr(el, 'data-lazy-srcset'));
      const src = attr(el, 'src');
      const placeholder = !src || /^data:/i.test(src) || /(blank|placeholder|spacer|lazy|loading)\.(gif|png|svg)/i.test(src);
      const pick = (placeholder && lazy) || pickSrcset(attr(el, 'srcset')) || src;
      for (const n of ['srcset', 'sizes', 'loading', 'data-src', 'data-srcset', 'data-lazy-src', 'data-lazy-srcset', 'data-original', 'data-lazy']) delAttr(el, n);
      if (pick && /^data:image\//i.test(pick)) setAttr(el, 'src', pick);
      else {
        const abs = pick ? resolve(pick, base) : null;
        delAttr(el, 'src');
        if (abs) jobs.push(fetchResource(abs, 'image').then((d) => { if (d) setAttr(el, 'src', d); }));
      }
    }
    if (tag === 'video' && attr(el, 'poster')) { const abs = resolve(attr(el, 'poster'), base); delAttr(el, 'poster'); if (abs) jobs.push(fetchResource(abs, 'image').then((d) => { if (d) setAttr(el, 'poster', d); })); }
    if (attr(el, 'background') && ['body', 'table', 'td', 'th', 'tr'].includes(tag)) { const abs = resolve(attr(el, 'background'), base); delAttr(el, 'background'); if (abs) jobs.push(fetchResource(abs, 'image').then((d) => { if (d) setAttr(el, 'background', d); })); }
    if (tag === 'image' || tag === 'use' || tag === 'feimage') { // SVG
      for (const n of ['href', 'xlink:href']) {
        const v = attr(el, n); if (!v || v.startsWith('#') || /^data:image\//i.test(v)) continue;
        delAttr(el, n);
        const abs = resolve(v, base);
        if (abs && tag !== 'use') jobs.push(fetchResource(abs, 'image').then((d) => { if (d) setAttr(el, n, d); }));
      }
    }
    if (attr(el, 'style')) { const s = attr(el, 'style'); jobs.push(inlineCss(s, base).then((t) => setAttr(el, 'style', t))); }
    if (tag === 'style') {
      const t = el.childNodes.map((c) => c.value || '').join('');
      jobs.push(inlineCss(t, base).then((css) => { el.childNodes = [{ nodeName: '#text', value: escapeCss(css), parentNode: el }]; }));
    }
  }
  await Promise.all(jobs);

  // Comments before the doctype go (they print nothing): the lock below is then in the document's first bytes, where
  // Chromium looks for the charset (review 03/10).
  doc.childNodes = doc.childNodes.filter((n) => n.nodeName !== '#comment');
  const htmlEl = doc.childNodes.find((n) => n.nodeName === 'html');
  const headEl = htmlEl?.childNodes.find((n) => n.nodeName === 'head');
  if (extraCss && headEl) {
    const st = { nodeName: 'style', tagName: 'style', attrs: [{ name: 'data-page-setup', value: '' }], namespaceURI: headEl.namespaceURI, childNodes: [], parentNode: headEl };
    st.childNodes = [{ nodeName: '#text', value: escapeCss(extraCss), parentNode: st }];
    headEl.childNodes.push(st);
  }
  const body = (htmlEl?.childNodes || []).find((n) => n.nodeName === 'body');
  const textLength = body ? textOf(body).replace(/\s+/g, ' ').trim().length : 0;
  let html = serialize(doc);

  // Parsed again as Chromium will (scripting on): nothing that could load, run or navigate may have survived.
  const check = parse(html, { scriptingEnabled: true });
  let unsafe = null;
  walk(check, (n) => {
    if (unsafe || !n.tagName) return;
    if (REMOVE.has(n.tagName) || n.tagName === 'noscript' || (n.tagName === 'meta' && (attr(n, 'http-equiv') !== undefined || attr(n, 'charset') !== undefined))) unsafe = n.tagName;
    else if ((n.attrs || []).some((a) => /^on/i.test(a.name) || (URL_ATTRS.has(a.name) && isDangerousUrl(a.value)))) unsafe = `${n.tagName} attribute`;
  });
  if (unsafe) throw new FetchRefused('This page contains markup that cannot be converted safely.', 'unsafe_markup');

  // The charset first (Chromium reads it within the first 1,024 bytes), then the policy, before any other element.
  const lock = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}">`;
  // First element of the document, but after a doctype (a tag before it would switch the page to quirks mode).
  const m = /^﻿?\s*(<!doctype[^>]{0,500}>)/i.exec(html);
  html = m ? html.slice(0, m[0].length) + lock + html.slice(m[0].length) : lock + html;
  const head = doc.childNodes.find((n) => n.nodeName === 'html')?.childNodes.find((n) => n.nodeName === 'head');
  const titleEl = head?.childNodes.find((n) => n.nodeName === 'title');
  return {
    html,
    finalUrl: page.url,
    title: titleEl ? textOf(titleEl).trim() : '',
    stats: { ...stats, textLength, scriptHeavy: stats.scripts >= 3 && textLength < 300 },
  };
}
