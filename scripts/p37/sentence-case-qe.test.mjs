// P37 lot 1, follow-up of item 2: Sentence case after "?" or "!" glued to the next letter ("what?ok").
// Run: node scripts/p37/sentence-case-qe.test.mjs
// Rule, same as for the period: "?" or "!" ends a sentence only when a space, a line break or the end of the text
// follows (closing quotes or brackets allowed in between). Glued to a letter or digit it does not: a URL query
// (page?q=test), a brand (Yahoo!Mail), a typo (what?ok). Neither convertcase.net nor Word's Sentence case documents
// this case; both describe sentences as text ending at a full stop, which we read as "followed by a space".
import { sentenceCase, countSentences } from '../../app/lib/textSegments.js';

const cases = [
  ['? glued to a word', 'what?ok', 'What?ok'],
  ['! glued to a word', 'wow!great', 'Wow!great'],
  ['URL query string', 'see example.com/page?q=test now', 'See example.com/page?q=test now'],
  ['brand name', 'yahoo!mail is old. it works', 'Yahoo!mail is old. It works'],
  ['? then space still starts a sentence', 'what? ok', 'What? Ok'],
  ['! then space still starts a sentence', 'wow! great', 'Wow! Great'],
  ['?! then space', 'really?! yes', 'Really?! Yes'],
  ['? then closing quote then space', 'he asked "why?" then left', 'He asked "why?" Then left'],
  ['? then line break', 'why?\nbecause', 'Why?\nBecause'],
  ['Japanese full-width marks unchanged', '本当？はい。', '本当？はい。'],
];
const counts = [
  ['what?ok is one sentence', 'what?ok', 1],
  ['URL query is one sentence', 'see example.com/page?q=test now.', 1],
  ['what? ok is two', 'what? ok', 2],
];
let fail = 0;
for (const [name, input, want] of cases) {
  const got = sentenceCase(input);
  const ok = got === want; if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`);
}
for (const [name, input, want] of counts) {
  const got = countSentences(input);
  const ok = got === want; if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  count: ${name}${ok ? '' : `  got ${got}, want ${want}`}`);
}
const total = cases.length + counts.length;
console.log(`\n${total - fail}/${total} passed`);
process.exit(fail ? 1 : 0);
