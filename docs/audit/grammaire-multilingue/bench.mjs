// Grammar Fixer (the real AI, through www's /api/ai, exactly as the page calls it) against LanguageTool (public API,
// every first suggestion applied), on PUBLISHED error corpora: 40 {src, ref} pairs per language (build.py, sources in
// docs/audit/RAPPORT-seance-27-09.md §3). Sentences are sent in batches, one per line, as a visitor would paste a
// text: numbered "1) ..." for the AI so each answer line can be matched back; plain lines for LanguageTool.
// Per sentence, against the corpus reference (NFC, spaces collapsed): exact match, and the share of the character
// distance to the reference that was closed, gain = (d(src,ref) - d(out,ref)) / d(src,ref): 1 = the reference,
// 0 = unchanged, < 0 = made worse.
// Usage: node docs/audit/grammaire-multilingue/bench.mjs <origin> <corpus dir> [--langs=fr,es] [--no-ai] [--no-lt] [--tag=x]
import fs from 'node:fs';
import path from 'node:path';

const [entry, dir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const langsArg = (process.argv.find((a) => a.startsWith('--langs=')) || '').slice(8);
const noAi = process.argv.includes('--no-ai');
const noLt = process.argv.includes('--no-lt'); // compare with a previous run's LanguageTool results instead
const LT = { fr: 'fr', es: 'es', de: 'de-DE', pt: 'pt-BR', it: 'it', ru: 'ru-RU', zh: 'zh-CN', ja: 'ja-JP', ar: 'ar', hi: null, tr: null };
const norm = (s) => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  a = [...a]; b = [...b];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
const score = (src, out, ref) => { const d0 = lev(norm(src), norm(ref)), d1 = lev(norm(out), norm(ref)); return { exact: norm(out) === norm(ref), gain: d0 ? (d0 - d1) / d0 : 0, worse: d1 > d0, unchanged: norm(out) === norm(src) }; };
// Batches whose AI answer stays well under the route's 1000 output tokens (CJK ~1 token/char, Cyrillic/Arabic/Devanagari ~0.5, Latin ~0.3).
const perChar = (l) => (['zh', 'ja'].includes(l) ? 1 : ['ru', 'ar', 'hi'].includes(l) ? 0.5 : 0.3);
function batches(lang, pairs) {
  const out = []; let cur = [], tok = 0;
  for (const p of pairs) {
    const t = (p.src.length + 5) * perChar(lang);
    if (cur.length && (tok + t > 800 || cur.reduce((a, x) => a + x.src.length + 5, 0) + p.src.length > 7500)) { out.push(cur); cur = []; tok = 0; }
    cur.push(p); tok += t;
  }
  if (cur.length) out.push(cur);
  return out;
}
let aiCalls = 0;
async function ai(lines) {
  const prompt = lines.map((s, i) => `${i + 1}) ${s}`).join('\n');
  aiCalls++;
  const r = await fetch(`${origin}/api/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, tool: 'grammar-fixer' }) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 429) { aiCalls--; const e = new Error(`AI 429, Retry-After ${r.headers.get('retry-after')} s (${Number(r.headers.get('retry-after')) > 3600 ? 'daily' : 'hourly'} limit)`); e.limit = true; throw e; }
  if (!j.text) throw new Error(`AI ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const got = new Map();
  for (const line of j.text.split('\n')) { const m = /^\s*(\d+)[).]\s*(.*)$/.exec(line); if (m) got.set(Number(m[1]), m[2]); }
  return lines.map((s, i) => (got.has(i + 1) ? { out: got.get(i + 1), parsed: true } : { out: s, parsed: false }));
}
async function languageTool(lines, code) {
  const text = lines.join('\n');
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch('https://api.languagetool.org/v2/check', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ text, language: code }) });
    if (r.status === 429) { await new Promise((ok) => setTimeout(ok, 15000)); continue; }
    const j = await r.json();
    let out = text; // apply from the end so offsets stay valid
    for (const m of [...j.matches].sort((a, b) => b.offset - a.offset)) if (m.replacements.length) out = out.slice(0, m.offset) + m.replacements[0].value + out.slice(m.offset + m.length);
    const res = out.split('\n');
    return lines.map((s, i) => res[i] ?? s);
  }
  throw new Error('LanguageTool: rate limited');
}
const summary = (rows) => rows.length ? { exact: rows.filter((r) => r.exact).length, gain: +(rows.reduce((a, r) => a + r.gain, 0) / rows.length).toFixed(3), medianGain: +[...rows.map((r) => r.gain)].sort((x, y) => x - y)[Math.floor(rows.length / 2)].toFixed(3), worse: rows.filter((r) => r.worse).length, unchanged: rows.filter((r) => r.unchanged).length } : null;

const langs = langsArg ? langsArg.split(',') : Object.keys(LT);
const results = {};
let stopped = null; // a 429 (hourly or daily limit) ends the run; finished languages are still written
for (const lang of langs) {
  if (stopped) break;
  const file = path.join(dir, `${lang}.jsonl`);
  if (!fs.existsSync(file)) { console.log(lang, 'no corpus'); continue; }
  const pairs = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const oursRows = [], ltRows = [], samples = [];
  let unparsed = 0;
  for (const b of batches(lang, pairs)) {
    const srcs = b.map((p) => p.src);
    let a = null;
    if (!noAi) try { a = await ai(srcs); } catch (e) { if (!e.limit) throw e; stopped = e.message; break; }
    const l = LT[lang] && !noLt ? await languageTool(srcs, LT[lang]) : null;
    b.forEach((p, i) => {
      if (a) { if (!a[i].parsed) unparsed++; oursRows.push(score(p.src, a[i].out, p.ref)); }
      if (l) ltRows.push(score(p.src, l[i], p.ref));
      samples.push({ src: p.src, ref: p.ref, ours: a?.[i].out, lt: l?.[i] }); // every output, so a corpus can be re-scored without calling the AI again
    });
    if (!noLt) await new Promise((ok) => setTimeout(ok, 3500)); // LanguageTool's public API: 20 requests/minute
  }
  if (stopped) { console.log(lang, 'incomplete, not written:', stopped); break; }
  results[lang] = { pairs: pairs.length, ours: summary(oursRows), languageTool: summary(ltRows), unparsedAiLines: unparsed, samples };
  console.log(lang, JSON.stringify({ ours: results[lang].ours, languageTool: results[lang].languageTool, unparsed }));
}
console.log('AI calls:', aiCalls, stopped ? `(stopped: ${stopped})` : '');
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const tag = (process.argv.find((a) => a.startsWith('--tag=')) || '').slice(6);
fs.writeFileSync(path.join(process.env.BENCH_OUT || here, `results${tag ? '-' + tag : ''}${langsArg ? '-' + langsArg.replace(/,/g, '-') : ''}.json`), JSON.stringify(results, null, 1));
