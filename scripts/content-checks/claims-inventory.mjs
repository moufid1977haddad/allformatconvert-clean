// Inventory of every privacy / free / limits / watermark / sign-up claim the site shows (P20, 01/10).
// Reads the text of every page and component under app/ (JSX text and string literals: what a visitor or a search
// engine can read, metadata included), splits it into sentences and keeps those that make one of these claims.
// Usage: node scripts/content-checks/claims-inventory.mjs [--json=out.json]   (prints a count per family)
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

export const FAMILIES = {
  local: /\b(never (leaves?|leave|uploaded|sent|stored|transmitted)|not (uploaded|sent|transmitted)|nothing (is |gets )?(uploaded|sent|transmitted|stored)|no (file )?uploads?\b|without (uploading|sending)|stays? (in|on) your (browser|device|computer)|(entirely|locally|right|directly|all) (in|on) your (browser|device)|processed locally|runs? locally|client-side|100 ?% (private|local|secure)|completely private|fully private|never leaves?|on your device|in your browser|privacy[- ]first|private by design|no server)/i,
  stored: /\b(no data stored|not stored|never stored|don'?t store|do not store|no (files? )?(are )?(stored|kept|saved)|deleted (after|as soon|immediately|right after|automatically)|never (keep|kept|saved))/i,
  free: /\b(free|no cost|no charge|at no cost|costs? nothing|without paying)\b/i,
  limits: /\b(no limits?|unlimited|limitless|no (file[- ])?size limits?|no caps?|no restrictions?|as many (times|files) as)\b/i,
  watermark: /\bwatermarks?\b/i,
  signup: /\b(sign[- ]?ups?|registration|register|no account|without an account|log ?in required|create an account)\b/i,
};

function texts(sf) {
  const out = [];
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) out.push({ text: n.text, pos: n.getStart(sf) });
    else if (ts.isTemplateExpression(n)) { out.push({ text: [n.head.text, ...n.templateSpans.map((s) => '…' + s.literal.text)].join(''), pos: n.getStart(sf) }); }
    else if (ts.isJsxText(n) && n.text.trim()) out.push({ text: n.text.replace(/\s+/g, ' '), pos: n.getStart(sf) });
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

function* files(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['api', 'node_modules'].includes(e.name)) yield* files(f); }
    else if (/\.(jsx|tsx|ts|js)$/.test(e.name) && !/\.worker\.js$/.test(e.name)) yield f;
  }
}

// Every claim sentence: { file, line, family, sentence }
export function inventory() {
  const rows = [];
  for (const file of files(path.join(ROOT, 'app'))) {
    const src = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const { text, pos } of texts(sf)) {
      if (text.length < 4 || !/\s/.test(text)) continue; // class names, keys, single words
      if (/^[\w-]+(\s[\w:/[\]-]+)+$/.test(text) && /\b(bg|text|px|py|rounded|flex|border|hover|dark):?/.test(text)) continue; // Tailwind classes
      const line = sf.getLineAndCharacterOfPosition(pos).line + 1;
      for (const sentence of text.split(/(?<=[.!?])\s+(?=[A-Z"“(])/)) {
        for (const [family, re] of Object.entries(FAMILIES)) {
          if (re.test(sentence)) rows.push({ file: path.relative(ROOT, file).replace(/\\/g, '/'), line, family, sentence: sentence.trim() });
        }
      }
    }
  }
  return rows;
}

const isMain = process.argv[1] && process.argv[1].endsWith('claims-inventory.mjs');
if (isMain) {
  const rows = inventory();
  const out = process.argv.find((a) => a.startsWith('--json='));
  if (out) fs.writeFileSync(out.slice(7), JSON.stringify(rows, null, 1));
  const by = {};
  for (const r of rows) by[r.family] = (by[r.family] || 0) + 1;
  console.log(by, `${rows.length} claim sentences in ${new Set(rows.map((r) => r.file)).size} files`);
}
