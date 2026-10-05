// P36: the text every tool page really serves (raw HTML, no JavaScript, as a crawler's first pass), section by section.
// Per page: <title>, meta description, H1, the SeoContent block split by its h2 headings (About, How to, Formats and
// limits, Where your file is processed, Example, FAQ as question/answer pairs, Tips, Related tools) and the words of
// the tool's own interface above it. Writes one JSON used by the audit, the uniqueness measure and the reviewers.
//   node scripts/p36/extract-content.mjs <origin> <out.json>
import fs from 'node:fs';
import path from 'node:path';

const [originArg, out] = process.argv.slice(2);
const origin = new URL(originArg).origin;
const pages = [];
for (const cat of fs.readdirSync('app/tools')) {
  const d = path.join('app/tools', cat);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const t of fs.readdirSync(d)) if (fs.statSync(path.join(d, t)).isDirectory() && fs.readdirSync(path.join(d, t)).some((f) => /^page\.(jsx|tsx|js)$/.test(f))) pages.push(`/tools/${cat}/${t}`);
}
// &amp; last, so that an entity shown as text ("&amp;lt;") stays "&lt;" (one decoding, as the browser does)
const ent = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;|&#160;/g, ' ').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, '&');
const text = (h) => ent(h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const words = (t) => (t.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;

// The SeoContent block: from data-seo-content to the end of <main>; split into cards by <h2>.
function sections(block) {
  const out = {};
  const parts = block.split(/<h2[^>]*>/i).slice(1);
  for (const p of parts) {
    const head = text(p.slice(0, p.search(/<\/h2>/i)));
    const body = p.slice(p.search(/<\/h2>/i) + 5);
    let key = head;
    if (/^About /.test(head)) key = 'about';
    else if (/^Frequently Asked Questions|^FAQ/i.test(head)) key = 'faq';
    else if (/^How (to|it)/i.test(head)) key = 'howto';
    else if (/^Tips/i.test(head)) key = 'tips';
    else if (/^Related tools/i.test(head)) key = 'related';
    else if (/^Example/i.test(head)) key = 'example';
    if (key === 'faq') {
      const qa = [...body.matchAll(/<p[^>]*font-semibold[^>]*>([\s\S]*?)<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => ({ q: text(m[1]), a: text(m[2]) }));
      out.faq = qa;
    } else if (key === 'howto' || key === 'tips' || key === 'related') {
      out[key] = [...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => text(m[1]).replace(/^\d+\s+/, '').replace(/^✓\s*/, ''));
      out[key + 'Heading'] = head;
    } else out[key] = { heading: head, text: text(body) };
  }
  return out;
}

const rows = [];
const queue = [...pages];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const p = queue.shift();
    try {
      const r = await fetch(origin + p);
      const h = await r.text();
      const title = ent((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(h) || [])[1] || '').trim();
      const desc = ent((/<meta[^>]+name="description"[^>]+content="([^"]*)"/i.exec(h) || [])[1] || '');
      const h1 = text((/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(h) || [])[1] || '');
      const main = (/<main[^>]*>([\s\S]*?)<\/main>/i.exec(h) || [])[1] || h;
      const at = main.indexOf('data-seo-content');
      const ui = at > 0 ? text(main.slice(0, main.lastIndexOf('<', at))) : text(main);
      const block = at > 0 ? main.slice(at) : '';
      const s = sections(block);
      rows.push({ path: p, status: r.status, title, desc, h1, uiWords: words(ui), ui, seoWords: words(text(block.replace(/<script[\s\S]*?<\/script>/gi, ''))), ...s });
    } catch (e) { rows.push({ path: p, error: String(e) }); }
  }
}));
rows.sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
const bad = rows.filter((r) => r.error || r.status !== 200 || !r.about);
console.log(`${rows.length} pages, ${bad.length} without a readable SEO block`, bad.map((r) => r.path).join(' '));
