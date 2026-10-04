// P31 (03/10): the Code Formatter engine in node (app/lib/codeFormat.js): detection, one sample per language, SQL
// dialects, accents/emoji, syntax errors with their line. XML's well-formedness check needs a browser (DOMParser):
// code-formatter-page.mjs covers it.   node scripts/p31/code-formatter-lib.mjs
import { detectLanguage, formatCode, errorText } from '../../app/lib/codeFormat.js';
import { SAMPLES, SQL_DIALECT_SAMPLES, ACCENTS, ERRORS, DETECT } from './code-formatter-samples.mjs';

let pass = 0, fail = 0;
const check = (name, ok, info = '') => { if (ok) pass++; else fail++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : info); };

for (const [text, lang] of DETECT) { const got = detectLanguage(text); check(`detect ${lang}: ${JSON.stringify(text.slice(0, 40))}`, got === lang, `got ${got}`); }
for (const s of [...SAMPLES, ACCENTS]) {
  let out = '';
  try { out = await formatCode(s.input, s.lang); } catch (e) { out = 'THREW ' + errorText(e); }
  const missing = s.expect.filter((x) => !out.includes(x));
  check(`format ${s.lang}${s === ACCENTS ? ' (accents/emoji)' : ''}`, !missing.length, `missing ${JSON.stringify(missing)}\n--- got:\n${out}`);
}
for (const s of SQL_DIALECT_SAMPLES) {
  let out = '';
  try { out = await formatCode(s.input, 'sql', { sqlDialect: s.dialect }); } catch (e) { out = (s.error ? '' : 'THREW ') + errorText(e); }
  const missing = (s.expect || [s.error]).filter((x) => !out.includes(x));
  check(`sql dialect ${s.dialect}`, !missing.length, `missing ${JSON.stringify(missing)}\n--- got:\n${out}`);
}
for (const s of ERRORS) {
  let msg = '';
  try { msg = 'NO ERROR: ' + await formatCode(s.input, s.lang); } catch (e) { msg = errorText(e); }
  const head = `Line ${s.line}` + (s.column ? `, column ${s.column}:` : '');
  check(`error ${s.lang} -> "${msg.split('\n')[0]}"`, msg.startsWith(head) && msg.includes('\n> ') && (!s.words || msg.includes(s.words)), msg);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
