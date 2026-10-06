// P37 lot 1, follow-up of item 2: Word Counter's sentence count after a period followed by a lower-case word.
// Run: node scripts/p37/word-counter-sentences.test.mjs
// Same rule as Sentence case: a period, a space, then a lower-case letter starts a sentence -- except after a known
// abbreviation (e.g., etc., Mr.), a one-letter initial, an ellipsis, or a period with no space after it (3.50, URLs).
import { countSentences } from '../../app/lib/textSegments.js';

const cases = [
  ['period + space + lower case', 'hello world. this is', 2],
  ['three lower-case sentences', 'one. two. three.', 3],
  ['after a closing bracket', 'it ended (really.) then more', 2],
  ['abbreviation e.g.', 'fruit, e.g. apples and pears.', 1],
  ['abbreviation etc.', 'pens, etc. and more.', 1],
  ['title Mr.', 'ask mr. smith today.', 1],
  ['Mr. before a capital', 'Mr. Smith paid.', 1],
  ['initial', 'john f. kennedy spoke.', 1],
  ['decimal', 'it costs 3.50 today. ok', 2],
  ['URL', 'see example.com/a.b now. done', 2],
  ['ellipsis', 'wait... what? ok', 2],
  ['p.m.', 'Dr. Who met Mrs. Jones at 5 p.m. yesterday. Then left.', 2],
  ['page example', 'Mr. Smith paid $3.50. Wait... really? Yes!', 3],
];
let fail = 0;
for (const [name, input, want] of cases) {
  const got = countSentences(input);
  const ok = got === want; if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  got ${got}, want ${want}  (${JSON.stringify(input)})`}`);
}
console.log(`\n${cases.length - fail}/${cases.length} passed`);
process.exit(fail ? 1 : 0);
