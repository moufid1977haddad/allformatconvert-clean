// Grammar Fixer's CORRECTION QUALITY (the real AI, through the site's /api/ai) against LanguageTool (its public API,
// the engine behind languagetool.org; every first suggestion applied, as "accept all" would), on the same texts.
// 25 known errors in 12 sentences, grouped in 3 texts as a visitor would paste them (3 AI calls per run), plus a
// text with no error that must come back unchanged (false corrections). An error counts as fixed when the wrong
// form is gone AND an accepted correct form is there; each list of accepted forms is written here, by hand.
// Usage: node scripts/browser-tests/grammar-vs-languagetool.mjs <origin> [--runs=2]
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const runs = Number((process.argv.find((a) => a.startsWith('--runs=')) || '--runs=1').slice(7));

const TEXTS = [
  'Their is many reason why peoples goes to school. She dont like it and he have went home yesterday. I could of helped you if you would of asked. Me and him goes to the store every weeks.',
  'The informations you gave me was very usefull. Its been a long time since I seen you. Between you and I, the results is not good. He don\'t know nothing about it.',
  'We was going to the park when it start raining. Each of the students have their own book. Your going to love this recipe, it\'s taste amazing. There are less people here then yesterday.',
];
const CLEAN = 'The committee has approved the new budget, and the early results are encouraging. Whom did you invite to the meeting on Tuesday? Neither of the reports was finished on time.';
// [label, wrong form (must be gone), accepted correct forms (one must be there)]
const ERRORS = [
  ['Their is -> There is/are', /\bTheir is\b/, /\bThere (are|is)\b/],
  ['many reason -> reasons', /\bmany reason\b/, /\bmany reasons\b/],
  ['peoples goes -> people go', /\bpeoples\b|\bpeople goes\b/, /\bpeople go\b/],
  ['dont -> doesn\'t', /\bdont\b|\bShe don['’]t\b/, /\bShe (doesn['’]t|does not)\b/],
  ['have went -> went / has gone', /\bhave went\b|\bhas went\b/, /\bhe (went|has gone)\b/],
  ['could of -> could have', /\bcould of\b/, /\bcould have\b/],
  ['would of -> had / would have', /\bwould of\b/, /\b(had asked|would have asked|you asked)\b/],
  ['Me and him -> He and I', /\bMe and him\b|\bHim and me\b/, /\b(He and I|He and me|I and he)\b/],
  ['goes (plural subject) -> go', /\b(and I|and me) goes\b|\bMe and him goes\b/, /\b(and I|and me|I and he) go\b/],
  ['every weeks -> every week', /\bevery weeks\b/, /\bevery week\b/],
  ['informations -> information', /\binformations\b/, /\binformation\b/],
  ['usefull -> useful', /\busefull\b/, /\buseful\b/],
  ['Its been -> It\'s been', /\bIts been\b/, /\bIt['’]s been|\bIt has been\b/],
  ['I seen -> I saw / have seen', /\bI seen\b/, /\bI (saw|last saw|have seen|['’]ve seen|had seen)\b|\bI['’]ve seen\b/],
  ['between you and I -> me', /\byou and I\b/, /\byou and me\b/],
  ['results is -> are', /\bresults is\b/, /\bresults are\b/],
  ['He don\'t -> doesn\'t', /\bHe don['’]t\b/, /\bHe (doesn['’]t|does not)\b/],
  ['don\'t know nothing -> anything', /\bknow nothing\b/, /\b(know anything|knows nothing|know nothing at all)\b/],
  ['We was -> were', /\bWe was\b/, /\bWe were\b/],
  ['it start -> started', /\bit start raining\b/, /\bit (started|starts|began) (raining|to rain)\b/],
  ['Each ... have -> has', /\bstudents have their own\b/, /\bstudents has\b/],
  ['Your going -> You\'re', /\bYour going\b/, /\bYou['’]re going|\bYou are going\b/],
  ['it\'s taste -> it tastes', /\bit['’]s taste\b/, /\b(it|It) tastes\b/],
  ['less people -> fewer', /\bless people\b/, /\bfewer people\b/],
  ['then yesterday -> than', /\bthen yesterday\b/, /\bthan (yesterday|there were yesterday)\b/],
];

async function ours(text) {
  const r = await fetch(`${origin}/api/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: text, tool: 'grammar-fixer' }) });
  const j = await r.json();
  if (!j.text) throw new Error(`/api/ai ${r.status}: ${j.error || JSON.stringify(j).slice(0, 200)}`);
  return j.text.trim();
}
async function languageTool(text) {
  const r = await fetch('https://api.languagetool.org/v2/check', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ text, language: 'en-US' }) });
  const j = await r.json();
  let out = text; // apply from the end so offsets stay valid
  for (const m of [...j.matches].sort((a, b) => b.offset - a.offset)) if (m.replacements.length) out = out.slice(0, m.offset) + m.replacements[0].value + out.slice(m.offset + m.length);
  return { out, flagged: j.matches.length };
}
const score = (out) => ERRORS.map(([label, bad, good]) => ({ label, fixed: !bad.test(out) && good.test(out) }));

for (let run = 1; run <= runs; run++) {
  const oursOut = []; const ltOut = [];
  for (const t of TEXTS) { oursOut.push(await ours(t)); ltOut.push((await languageTool(t)).out); }
  const oursClean = await ours(CLEAN); const ltClean = (await languageTool(CLEAN)).out;
  const a = score(oursOut.join(' ')); const b = score(ltOut.join(' '));
  console.log(`\n=== run ${run}`);
  for (let i = 0; i < ERRORS.length; i++) console.log(`${a[i].fixed ? 'ours ✔' : 'ours ✘'}  ${b[i].fixed ? 'LT ✔' : 'LT ✘'}  ${ERRORS[i][0]}`);
  console.log(`fixed: ours ${a.filter((x) => x.fixed).length}/${ERRORS.length}, LanguageTool ${b.filter((x) => x.fixed).length}/${ERRORS.length}`);
  console.log(`text without errors unchanged: ours ${oursClean === CLEAN ? 'yes' : 'NO -> ' + JSON.stringify(oursClean)}, LanguageTool ${ltClean === CLEAN ? 'yes' : 'NO -> ' + JSON.stringify(ltClean)}`);
  console.log('ours:', JSON.stringify(oursOut));
  console.log('LT:  ', JSON.stringify(ltOut));
}
