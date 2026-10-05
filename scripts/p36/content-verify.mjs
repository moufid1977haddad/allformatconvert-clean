// P36 — automatic check n° 1 of the rewritten tool pages: every limit, format, label and processing place a page states
// is compared with the code. Read from the SOURCE (TypeScript AST), so it runs without a build:
//   - the page's SEO texts: the SeoContent props (or the seo={{…}} / const seo = {…} object given to a shared shell):
//     description, howTo, howToTitle, specs, privacy, faqs, tips; and layout.tsx metadata (title, description, openGraph).
//   - "rewritten" = the page passes `specs` AND `privacy` (P36 template). Checks marked [R] apply to rewritten pages only;
//     --require-all makes a page that is not rewritten a failure (final run).
// Checks:
//   C0 the page and its layout parse (no syntax error).                                                         [all]
//   C1 metadata: title ≤ 60 characters, description 110-155, openGraph = same texts, both unique on the whole site,
//      description different from the About text.                                                              [all]
//   C2 structure: 3-6 steps, 3-6 FAQ, specs ≥ 2 rows, privacy present, About 40-170 words.                     [R]
//   C3 numbers: every number with a unit written as text (not computed by ${…} from the code) must be proved in
//      docs/audit/p36/preuves/<lot>.json: { "<path>": [ { "claim": "60 seconds", "file": "app/…", "pattern": "regex" } ] }
//      -- the claim must appear in the page's text and the pattern must match in that file.                    [R]
//   C4 formats: each format named in the specs rows about input/output must appear in the page's code (accept
//      attribute, MIME, extension or library), case-insensitive.                                               [R]
//   C5 processing: a tool whose code sends data (scripts/content-checks/privacy-claims.mjs SENDS) must say where in
//      `privacy` (our server / service / provider named); a tool that sends nothing must not say it uploads.   [R]
//   C6 forbidden phrases (template §2e): unverifiable superlatives, generic filler, "install any software"…     [R]
//   C7 identical sentences between pages (source text, ${…} → …): no pair of rewritten pages above 30 %.          [R]
// Button labels quoted in steps / FAQ / tips / specs / privacy are checked by scripts/content-checks/instructions.mjs;
// "nothing is sent" claims by scripts/content-checks/privacy-claims.mjs (both part of `npm run build`).
//   node scripts/p36/content-verify.mjs [--only=pdf-tools/] [--require-all] [--verbose]
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { toolPages, readPage } from '../content-checks/instructions.mjs';
// Read from privacy-claims.mjs's source (importing it would run its check and exit): the one definition of "sends data".
const PC = fs.readFileSync(path.join(import.meta.dirname, '../content-checks/privacy-claims.mjs'), 'utf8');
const SENDS = eval(/export const SENDS = (\/.*\/[a-z]*);/.exec(PC)[1]);
const SENDS_VIA_BROWSER = eval(/export const SENDS_VIA_BROWSER = (\/.*\/[a-z]*);/.exec(PC)[1]);

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const only = args.only || '';
const verbose = 'verbose' in args;
const parse = (file) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8').replace(/^﻿/, ''), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const nameOf = (n) => (n.name && (ts.isIdentifier(n.name) || ts.isStringLiteral(n.name)) ? n.name.text : null);

// Static text of an expression: string pieces kept, ${…} replaced by "…" (a value computed from the code).
function staticText(n) {
  if (!n) return null;
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
  if (ts.isTemplateExpression(n)) return n.head.text + n.templateSpans.map((s) => '…' + s.literal.text).join('');
  if (ts.isParenthesizedExpression(n)) return staticText(n.expression);
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) return (staticText(n.left) ?? '…') + (staticText(n.right) ?? '…');
  if (ts.isJsxExpression(n)) return staticText(n.expression);
  return '…';
}
const arr = (n) => (n && ts.isArrayLiteralExpression(n) ? n.elements : []);
const prop = (obj, k) => obj?.properties?.find((p) => ts.isPropertyAssignment(p) && nameOf(p) === k)?.initializer;

// The SEO object of a page: SeoContent's attributes, or an object literal with description + howTo/faqs.
function seoOf(file) {
  const sf = parse(file);
  let found = null;
  const fromObj = (o) => ({ title: staticText(prop(o, 'title')), description: staticText(prop(o, 'description')), howToTitle: staticText(prop(o, 'howToTitle')),
    howTo: arr(prop(o, 'howTo')).map(staticText), tips: arr(prop(o, 'tips')).map(staticText),
    faqs: arr(prop(o, 'faqs')).map((e) => ({ q: staticText(prop(e, 'q')), a: staticText(prop(e, 'a')) })),
    specs: prop(o, 'specs') ? arr(prop(o, 'specs')).map((e) => ({ label: staticText(prop(e, 'label')), value: staticText(prop(e, 'value')) })) : null,
    privacy: prop(o, 'privacy') ? staticText(prop(o, 'privacy')) : null });
  const visit = (n) => {
    if (found) return;
    if ((ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) && n.tagName.getText(sf) === 'SeoContent') {
      const attrs = {};
      for (const a of n.attributes.properties) if (ts.isJsxAttribute(a) && a.initializer) attrs[a.name.getText(sf)] = ts.isJsxExpression(a.initializer) ? a.initializer.expression : a.initializer;
      if (attrs.description) {
        const o = ts.factory.createObjectLiteralExpression(Object.entries(attrs).map(([k, v]) => ts.factory.createPropertyAssignment(k, v)));
        found = fromObj(o);
        return;
      }
    }
    if (ts.isObjectLiteralExpression(n) && prop(n, 'description') && (prop(n, 'howTo') || prop(n, 'faqs'))) { found = fromObj(n); return; }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return found;
}

function metaOf(layout) {
  if (!fs.existsSync(layout)) return null;
  const sf = parse(layout);
  let meta = null;
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && n.name.getText(sf) === 'metadata' && n.initializer && ts.isObjectLiteralExpression(n.initializer)) meta = n.initializer;
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (!meta) return null;
  const t = prop(meta, 'title');
  const title = t && ts.isObjectLiteralExpression(t) ? staticText(prop(t, 'absolute') || prop(t, 'default')) : staticText(t);
  const og = prop(meta, 'openGraph');
  return { title, description: staticText(prop(meta, 'description')), ogTitle: og ? staticText(prop(og, 'title')) : null, ogDescription: og ? staticText(prop(og, 'description')) : null };
}

const words = (t) => (String(t || '').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
const UNIT = String.raw`(?:KB|MB|GB|TB|kB|Mo|px|pixels?|MP|megapixels?|pages?|files?|images?|photos?|seconds?|secs?|minutes?|mins?|hours?|days?|characters?|chars|words?|lines?|rows?|columns?|%|fps|dpi|kbps|kb\/s|Hz|kHz|bits?|bytes?|languages?|colou?rs?|frames?|levels?|times|×|x\b)`;
const NUM_RE = new RegExp(String.raw`(?<![\w.])(\d[\d,.  ]*\d|\d)\s?(?:-|–|to)?\s?(?:\d[\d,.]*\s?)?${UNIT}`, 'g');
const FORBIDDEN = [
  /\bunlimited\b/i, /\bno (file[- ]?size )?limits?\b/i, /\blimitless\b/i, /\b100 ?%/i, /\bfastest\b/i, /\bbest[- ]quality\b/i, /\bbest\b(?! (results?|for|when|on|with|if|to|balance|choice))/i,
  /\blightning\b/i, /\bblazing\b/i, /\bseamless(ly)?\b/i, /\bin (just )?(a few )?seconds\b/i, /\bany device\b/i, /\bindustry[- ](standard|leading)\b/i, /\btrusted by\b/i,
  /\binstall any software\b/i, /\bcompletely free with no (signup|sign-up|registration)\b/i, /\bfast, (easy|simple)\b/i, /\beasy[- ]to[- ]use\b/i, /\bhassle\b/i,
  /\bmilitary[- ]grade\b/i, /\bbank[- ](level|grade)\b/i, /\bGDPR[- ](compliant|certified)\b/i, /\bISO ?27001\b/i, /\b256-bit\b(?! AES)/i, /\bperfect(ly)?\b/i, /\bflawless(ly)?\b/i, /\bguarantee[ds]?\b/i,
];
const SAYS_SERVER = /\b(our (own )?(\w+[- ])?(server|service)s?|server|ConvertAPI|OpenAI|Pangram|Google|Railway|Gotenberg|LibreOffice|uploaded|sent to)\b/i;
const SAYS_UPLOAD = /\b(is|are|gets?) (uploaded|sent) to\b|\bon our (own )?server\b|\bour server\b/i;

const pages = toolPages().filter((p) => p.slug.startsWith(only) || !only);
const allPages = toolPages();
const fails = [];
const fail = (slug, check, msg) => fails.push({ slug, check, msg });
const proofsDir = path.join(ROOT, 'docs/audit/p36/preuves');
const proofs = {};
if (fs.existsSync(proofsDir)) for (const f of fs.readdirSync(proofsDir).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(proofsDir, f), 'utf8'));
  for (const [k, v] of Object.entries(j)) proofs[k] = [...(proofs[k] || []), ...v];
}

// C1 over the whole site (titles and descriptions must be unique everywhere).
const metas = allPages.map((p) => ({ ...p, meta: metaOf(path.join(path.dirname(p.file), 'layout.tsx')), seo: seoOf(p.file) }));
const seenT = new Map(), seenD = new Map();
for (const m of metas) {
  if (m.meta?.title) seenT.set(m.meta.title.toLowerCase(), [...(seenT.get(m.meta.title.toLowerCase()) || []), m.slug]);
  if (m.meta?.description) seenD.set(m.meta.description.toLowerCase(), [...(seenD.get(m.meta.description.toLowerCase()) || []), m.slug]);
}
const rewritten = (m) => !!(m.seo?.specs && m.seo?.privacy);
const sentences = (m) => {
  const s = m.seo;
  const parts = [s.description, ...s.howTo, ...s.faqs.flatMap((f) => [f.q, f.a]), ...s.tips, ...(s.specs || []).map((r) => r.value), s.privacy];
  return new Set(parts.filter(Boolean).flatMap((t) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)).map((x) => x.toLowerCase().replace(/[“”"]/g, '"').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').replace(/[.!?:;,\s]+$/, '').trim()).filter((x) => x.split(' ').length >= 3));
};

for (const m of metas.filter((x) => pages.includes(pages.find((p) => p.slug === x.slug)))) {
  const { slug, meta, seo } = m;
  const pth = `/tools/${slug}`;
  for (const f of [m.file, path.join(path.dirname(m.file), 'layout.tsx')]) { const d = parse(f).parseDiagnostics || []; if (d.length) fail(slug, 'C0', `syntax error in ${path.relative(ROOT, f)}: ${ts.flattenDiagnosticMessageText(d[0].messageText, ' ')}`); }
  if (!meta) { fail(slug, 'C1', 'no metadata in layout.tsx'); continue; }
  if (!seo) { fail(slug, 'C2', 'no SEO object found in the page'); continue; }
  if (!meta.title || meta.title.includes('…')) fail(slug, 'C1', `title not a plain string: ${meta.title}`);
  else if (meta.title.length > 60) fail(slug, 'C1', `title ${meta.title.length} > 60: ${meta.title}`);
  if (!meta.description || meta.description.length > 155 || meta.description.length < 110) fail(slug, 'C1', `description ${meta.description?.length} not in 110-155: ${meta.description}`);
  if (meta.ogTitle !== meta.title || meta.ogDescription !== meta.description) fail(slug, 'C1', 'openGraph title/description differ from the page metadata');
  if (seenT.get(meta.title?.toLowerCase())?.length > 1) fail(slug, 'C1', `title shared with ${seenT.get(meta.title.toLowerCase()).filter((s) => s !== slug).join(', ')}`);
  if (seenD.get(meta.description?.toLowerCase())?.length > 1) fail(slug, 'C1', `description shared with ${seenD.get(meta.description.toLowerCase()).filter((s) => s !== slug).join(', ')}`);
  if (seo.description && meta.description && seo.description.slice(0, 60) === meta.description.slice(0, 60)) fail(slug, 'C1', 'meta description repeats the About text');
  if (!rewritten(m)) { if ('require-all' in args) fail(slug, 'C2', 'not rewritten (no specs/privacy)'); continue; }

  // C2
  if (seo.howTo.length < 3 || seo.howTo.length > 6) fail(slug, 'C2', `${seo.howTo.length} steps (3-6)`);
  if (seo.faqs.length < 3 || seo.faqs.length > 6) fail(slug, 'C2', `${seo.faqs.length} FAQ (3-6)`);
  if (seo.specs.length < 2) fail(slug, 'C2', `${seo.specs.length} specs rows (≥ 2)`);
  const aw = words(seo.description);
  if (aw < 40 || aw > 170) fail(slug, 'C2', `About ${aw} words (40-170)`);

  // C3 numbers
  const texts = [meta.title, meta.description, seo.description, seo.howToTitle, ...seo.howTo, ...seo.tips, ...seo.faqs.flatMap((f) => [f.q, f.a]), ...seo.specs.flatMap((r) => [r.label, r.value]), seo.privacy].filter(Boolean);
  const all = texts.join('\n');
  const mine = proofs[pth] || [];
  for (const p of mine) {
    const f = path.join(ROOT, p.file);
    if (!all.includes(p.claim)) fail(slug, 'C3', `proof for "${p.claim}" but the claim is not in the page`);
    if (!fs.existsSync(f)) { fail(slug, 'C3', `proof file missing: ${p.file}`); continue; }
    let re; try { re = new RegExp(p.pattern, 'm'); } catch { fail(slug, 'C3', `bad pattern for "${p.claim}"`); continue; }
    if (!re.test(fs.readFileSync(f, 'utf8'))) fail(slug, 'C3', `pattern for "${p.claim}" not found in ${p.file}: /${p.pattern}/`);
  }
  for (const t of texts) for (const mm of t.matchAll(NUM_RE)) {
    const claim = mm[0].trim();
    if (!mine.some((p) => p.claim.includes(claim) || claim.includes(p.claim))) fail(slug, 'C3', `number not proved: "${claim}" in «${t.slice(Math.max(0, mm.index - 40), mm.index + 50)}»`);
  }

  // C4 formats named in input/output rows
  const code = readPage(m.file).code.toLowerCase();
  for (const r of seo.specs.filter((r) => /\b(input|output|format|accept|open|read|save|download|export|file types?)\b/i.test(r.label || ''))) {
    for (const f of (r.value || '').match(/\b[A-Z][A-Z0-9]{1,5}\b/g) || []) {
      if (/^(PDF|OR|AND|UTF|URL|ID|HTML|CSS|JS|API|RGB|CMYK|OCR|AI|MB|GB|KB|DPI|PPI|EXIF|ICC|AES|SHA|MD5|US|UK|EU|ISO|IETF|RFC|JSON|ASCII)$/.test(f) && code.includes(f.toLowerCase())) continue;
      if (!code.includes(f.toLowerCase())) fail(slug, 'C4', `format ${f} (specs "${r.label}") not found in the page's code`);
    }
  }

  // C5 processing
  const sends = SENDS.test(readPage(m.file).code) || SENDS_VIA_BROWSER.test(readPage(m.file).code);
  if (sends && !SAYS_SERVER.test(seo.privacy)) fail(slug, 'C5', 'code sends data but `privacy` does not say where');
  if (!sends && SAYS_UPLOAD.test(seo.privacy) && !/\bnot\b|\bnever\b|\bno\b/i.test(seo.privacy)) fail(slug, 'C5', 'code sends nothing but `privacy` says the file goes to a server');

  // C6 forbidden phrases
  for (const t of texts) for (const re of FORBIDDEN) if (re.test(t)) fail(slug, 'C6', `forbidden phrase ${re} in «${t.slice(0, 120)}»`);
}

// C7 identical sentences between rewritten pages (whole site, so twins in other lots are caught too)
const rw = metas.filter(rewritten).map((m) => ({ slug: m.slug, s: sentences(m) }));
let maxPair = { r: 0 };
for (let i = 0; i < rw.length; i++) for (let j = i + 1; j < rw.length; j++) {
  let sh = 0; for (const x of rw[i].s) if (rw[j].s.has(x)) sh++;
  const r = sh / Math.max(1, Math.min(rw[i].s.size, rw[j].s.size));
  if (r > maxPair.r) maxPair = { r, a: rw[i].slug, b: rw[j].slug };
  if (r > 0.3 && (rw[i].slug.startsWith(only) || rw[j].slug.startsWith(only))) fail(rw[i].slug, 'C7', `${(r * 100).toFixed(0)} % identical sentences with ${rw[j].slug}`);
}

const byCheck = {};
for (const f of fails) byCheck[f.check] = (byCheck[f.check] || 0) + 1;
for (const f of fails) console.log(`FAIL ${f.check} ${f.slug}: ${f.msg}`);
const nRw = metas.filter((m) => rewritten(m) && m.slug.startsWith(only)).length;
console.log(`\n${pages.length} pages checked (${only || 'all'}), ${nRw} rewritten; ${fails.length} failure(s) ${JSON.stringify(byCheck)}; max identical-sentence share between rewritten pages: ${(maxPair.r * 100).toFixed(1)} %${maxPair.a ? ` (${maxPair.a} / ${maxPair.b})` : ''}`);
if (verbose) for (const m of metas.filter((x) => x.slug.startsWith(only))) console.log(m.slug, m.meta?.title?.length, m.meta?.description?.length, rewritten(m) ? 'R' : '-');
process.exitCode = fails.length ? 1 : 0;
