// PART 3 of 30/09 (bloquant 5): the AI tools never checked with a real call, run ONCE each on the given origin (www),
// as a visitor, with real paid calls (budget set by the owner: 2 $ in all). Estimated cost per call printed (token
// counts approximated at 4 characters per token; Whisper by the audio's duration; the image by its reservation).
// 1 PDF AI Summary: French and Spanish PDFs -> summary in the document's language?
// 2 AI Chatbot: 3 messages, the 3rd needs the 1st (context kept?)
// 3 AI Detector: a human text and an AI text, in English and French
// 4 Audio Transcriber: 19 s of synthetic English speech -> words right? (SRT export: see the page)
// 5 Image Generator: one image, downloadable as WebP and PNG
// Usage: node scripts/browser-tests/ai-real-calls-30-09.mjs <origin> <speech.wav> [--only=summary,chatbot,detector,transcriber,image]
import { chromium } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv[2]).origin;
const wav = process.argv[3];
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const run = (k) => !only || only.includes(k);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-real-'));
const tok = (s) => Math.ceil(String(s || '').length / 4);
const costText = (inChars, outText) => (tok(inChars) * 0.15 + tok(outText) * 0.6) / 1e6;
let total = 0;
const log = (name, cost, detail) => { total += cost; console.log(`${name} | ~${cost.toFixed(5)} $ | ${detail}`); };
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
const texts = {
  fr: "Rapport annuel de la bibliothèque municipale de Lyon. En 2025, la bibliothèque a accueilli 412 000 visiteurs, soit une hausse de 8 % par rapport à l'année précédente. Les prêts de livres numériques ont doublé, tandis que les prêts de livres imprimés sont restés stables. Trois nouvelles salles d'étude ont ouvert au deuxième étage, et les horaires du samedi ont été prolongés jusqu'à 20 heures. Le principal défi reste le financement : la subvention de la ville a baissé de 5 %, ce qui oblige la bibliothèque à chercher des partenariats avec des entreprises locales. Pour 2026, la direction prévoit un atelier de programmation pour les adolescents et un service de livraison à domicile pour les personnes âgées.",
  es: "Informe del club de ciclismo de Valencia. Durante la temporada 2025, el club organizó 46 salidas en grupo y recorrió en total más de 3.200 kilómetros. El número de socios pasó de 120 a 158, sobre todo gracias a las salidas para principiantes de los domingos. Se compraron dos bicicletas eléctricas para préstamo y se firmó un acuerdo con un taller del barrio para revisiones a mitad de precio. El problema principal fue la seguridad en la carretera de la costa: el club pidió al ayuntamiento un carril bici protegido. Para 2026 se planea una ruta solidaria a beneficio del hospital infantil.",
};
async function pdfOf(text) {
  const doc = await PDFDocument.create(); const font = await doc.embedFont(StandardFonts.Helvetica);
  const pg = doc.addPage([595, 842]); const words = text.split(' '); let line = '', y = 800;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (font.widthOfTextAtSize(t, 11) > 500) { pg.drawText(line, { x: 48, y, size: 11, font }); y -= 16; line = w; } else line = t; }
  pg.drawText(line, { x: 48, y, size: 11, font });
  return Buffer.from(await doc.save());
}
const guessLang = (s) => { const t = ' ' + s.toLowerCase() + ' '; const c = (ws) => ws.reduce((n, w) => n + (t.split(` ${w} `).length - 1), 0); const fr = c(['le', 'la', 'les', 'des', 'et', 'une', 'du', 'pour']), es = c(['el', 'los', 'las', 'del', 'y', 'una', 'para', 'con']), en = c(['the', 'and', 'of', 'to', 'a', 'in', 'for', 'with']); return fr > es && fr > en ? 'fr' : es > fr && es > en ? 'es' : 'en'; };

if (run('summary')) for (const lang of ['fr', 'es']) {
  const f = path.join(dir, `rapport-${lang}.pdf`); fs.writeFileSync(f, await pdfOf(texts[lang]));
  await page.goto(origin + '/tools/pdf-tools/pdf-ai-summary', { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').first().setInputFiles(f);
  await page.getByRole('button', { name: /Summarize PDF/ }).click();
  const out = page.locator('textarea').last();
  await page.waitForFunction(() => { const t = [...document.querySelectorAll('textarea')].pop(); return t && t.value.length > 20; }, null, { timeout: 90000 }).catch(() => {});
  const s = await out.inputValue().catch(() => '');
  log(`summary ${lang}`, costText(texts[lang].length + 160, s), `answer in ${guessLang(s)} (document ${lang}) ${guessLang(s) === lang ? 'OK' : 'WRONG LANGUAGE'} :: ${s.slice(0, 160).replace(/\n/g, ' ')}`);
}
if (run('chatbot')) {
  await page.goto(origin + '/tools/ai-tools/ai-chatbot', { waitUntil: 'networkidle' });
  const msgs = ['Please remember this code word for later: BANYAN-47. Just reply "noted".', 'What is 12 times 12?', 'What was the code word I gave you at the start?'];
  let convo = '';
  for (const m of msgs) {
    const before = await page.locator('body').innerText();
    await page.getByPlaceholder('Ask me anything...').fill(m);
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForFunction((n) => document.body.innerText.length > n + m.length + 2 && !/Thinking|\.\.\.$/.test(document.body.innerText.slice(-40)), before.length, { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const after = await page.locator('body').innerText();
    const reply = after.slice(before.length).replace(m, '').trim().slice(0, 200);
    convo += m + reply;
    log(`chatbot "${m.slice(0, 30)}…"`, costText(convo.length + 100, reply), reply.replace(/\n/g, ' '));
  }
  const last = (await page.locator('body').innerText());
  console.log('chatbot context kept:', /BANYAN-47/.test(last.slice(last.lastIndexOf('What was the code word'))) ? 'YES' : 'NO');
}
if (run('detector')) {
  const samples = {
    'human EN (Lincoln, 1863)': 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live.',
    'AI EN (written by Claude)': 'In today\'s fast-paced digital landscape, effective time management has become more important than ever. By leveraging proven strategies such as prioritization, time-blocking, and mindful breaks, individuals can significantly enhance their productivity. Furthermore, embracing digital tools can streamline workflows and reduce stress. Ultimately, mastering time management is not just about doing more; it is about creating a balanced, fulfilling life where both personal and professional goals can thrive.',
    'human FR (the owner, 30/09)': 'Le propriétaire dort puis est occupé toute la journée : tu travailles seul jusqu\'à la fin de ce prompt. Recherche des concurrents avant chaque choix, résultat au moins égal aux concurrents, décide toi-même, ne soumets aucun choix au propriétaire. Un message d\'erreur honnête n\'est pas une solution : l\'outil doit fonctionner sur Safari iPhone et sur Safari Mac.',
    'AI FR (written by Claude)': 'À l\'ère du numérique, la gestion efficace du temps est devenue un enjeu essentiel pour chacun. En adoptant des stratégies éprouvées, telles que la priorisation des tâches et la planification par blocs, il est possible d\'améliorer considérablement sa productivité. Par ailleurs, les outils numériques permettent de simplifier les processus et de réduire le stress. En définitive, maîtriser son temps, c\'est avant tout trouver un équilibre harmonieux entre vie personnelle et vie professionnelle.',
  };
  for (const [label, text] of Object.entries(samples)) {
    await page.goto(origin + '/tools/ai-tools/ai-detector', { waitUntil: 'networkidle' });
    await page.getByPlaceholder('Paste text to analyze...').fill(text);
    await page.getByRole('button', { name: /Detect AI Content/ }).click();
    // since 30/09 the page shows a verdict (RAIDAR); before, the model's opinion in a text box
    await page.waitForFunction(() => document.querySelector('[data-verdict]') || [...document.querySelectorAll('textarea')].slice(1).some((t) => t.value.length > 20), null, { timeout: 90000 }).catch(() => {});
    const verdict = await page.locator('[data-verdict]').getAttribute('data-verdict').catch(() => null);
    const out = verdict ? await page.locator('[data-verdict]').innerText() : await page.locator('textarea').last().inputValue().catch(() => '');
    const pct = (out.match(/(\d{1,3})\s?%/) || [])[1];
    log(`detector ${label}`, costText(text.length * 2 + 200, text), `${verdict || '(old page)'} ${pct ?? '?'} % :: ${out.slice(0, 160).replace(/\n/g, ' ')}`);
  }
}
if (run('transcriber')) {
  await page.goto(origin + '/tools/ai-tools/audio-transcriber', { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').first().setInputFiles(wav);
  await page.waitForFunction(() => { const t = document.querySelector('textarea'); return t && t.value.length > 20; }, null, { timeout: 120000 }).catch(() => {});
  const out = await page.locator('textarea').first().inputValue().catch(() => '');
  const want = 'welcome to the weekly team meeting first the new website will launch on monday morning second please send your quarterly reports to sarah before friday finally the office will be closed next thursday for maintenance thank you and have a great week'.split(' ');
  const got = out.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean);
  const hit = want.filter((w) => got.includes(w)).length;
  const secs = (fs.statSync(wav).size - 44) / (22050 * 2);
  const srt = await page.getByRole('button', { name: /SRT/ }).count();
  log('transcriber', (secs / 60) * 0.006, `${hit}/${want.length} words right, ${secs.toFixed(1)} s of audio, SRT export offered: ${srt ? 'yes' : 'NO'} :: ${out.slice(0, 160)}`);
}
if (run('image')) {
  await page.goto(origin + '/tools/ai-tools/image-generator', { waitUntil: 'networkidle' });
  await page.getByPlaceholder(/red fox/).fill('A small red lighthouse on a rocky island at sunset, watercolor painting');
  const t0 = Date.now();
  await page.getByRole('button', { name: /Generate/ }).last().click();
  const dl = page.locator('a[download]').first();
  const ok = await dl.waitFor({ timeout: 180000 }).then(() => true, () => false);
  if (!ok) log('image', 0, 'NO RESULT :: ' + (await page.locator('body').innerText()).slice(0, 300).replace(/\n/g, ' '));
  else {
    const [d] = await Promise.all([page.waitForEvent('download'), dl.click()]);
    const f = path.join(dir, d.suggestedFilename()); await d.saveAs(f);
    const m = await sharp(f).metadata();
    let png = '';
    const pbtn = page.getByRole('button', { name: /Download PNG/ });
    if (await pbtn.count()) { const [d2] = await Promise.all([page.waitForEvent('download'), pbtn.click()]); const f2 = path.join(dir, d2.suggestedFilename()); await d2.saveAs(f2); const m2 = await sharp(f2).metadata(); png = `${d2.suggestedFilename()} ${m2.format} ${m2.width}x${m2.height}`; }
    log('image', 0.03, `(reservation = worst case; exact cost in the Vercel log line [openai-image] cost_micros) ${d.suggestedFilename()} ${m.format} ${m.width}x${m.height} ${(fs.statSync(f).size / 1e3).toFixed(0)} KB, ${((Date.now() - t0) / 1000).toFixed(0)} s; PNG: ${png || 'none'}`);
  }
}
await b.close();
console.log(`TOTAL estimated: ~${total.toFixed(4)} $`);
