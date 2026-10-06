// P37 lot 1, item 2: Sentence case after a period followed by a lower-case word.
// Run: node scripts/p37/sentence-case.test.mjs
// Rule (convertcase.net: "Every letter after a full stop will get converted into an upper case letter"; Word's
// Change Case > Sentence case does the same after ". "): a period, then a space, then a lower-case letter starts a
// sentence. Not without a space (decimals, URLs, file names, hello.world), not after an ellipsis, a known
// abbreviation (e.g., etc., Mr.) or a one-letter initial.
import { sentenceCase } from '../../app/lib/textSegments.js';

const cases = [
  ['period + space + lower case', 'hello world. this is it', 'Hello world. This is it'],
  ['P36 example', 'end. next', 'End. Next'],
  ['several sentences', 'one. two. three.', 'One. Two. Three.'],
  ['after a closing quote or bracket', 'he said "stop." then left. (really.) yes', 'He said "stop." Then left. (Really.) Yes'],
  ['before an opening quote (after ? ICU always starts a sentence, as before)', 'it ended. "then what?" she asked', 'It ended. "Then what?" She asked'],
  ['no space: word.word', 'hello.world', 'Hello.world'],
  ['decimal', 'pi is 3.14 today. ok', 'Pi is 3.14 today. Ok'],
  ['URL and file name', 'see example.com/a.b or read me.txt. done', 'See example.com/a.b or read me.txt. Done'],
  ['abbreviation e.g.', 'fruit, e.g. apples', 'Fruit, e.g. apples'],
  ['abbreviation etc.', 'pens, etc. and more', 'Pens, etc. and more'],
  ['title Mr.', 'ask mr. smith', 'Ask mr. smith'],
  ['initial', 'john f. kennedy', 'John f. kennedy'],
  ['ellipsis', 'wait... what? ok', 'Wait... what? Ok'],
  ['newline', 'first.\nsecond', 'First.\nSecond'],
  ['shouting kept as before', 'HELLO WORLD. THIS IS A TEST!', 'Hello world. This is a test!'],
  ['pronoun I', 'yes. i think so.', 'Yes. I think so.'],
];
let fail = 0;
for (const [name, input, want] of cases) {
  const got = sentenceCase(input);
  const ok = got === want; if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`);
}
console.log(`\n${cases.length - fail}/${cases.length} passed`);
process.exit(fail ? 1 : 0);
