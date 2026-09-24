// Word Counter / Case Converter / Text Reverser on the inputs that break the reference sites
// (docs/audit/RAPPORT-licence-et-ameliorations.md §5). Run: node scripts/text-tests/01-text-segments.mjs
import assert from 'node:assert/strict';
import * as t from '../../app/lib/textSegments.js';

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log('PASS', name); };

const SAMPLE = 'Hello world. Mr. Smith paid $3.50 for it! Wait... what? 👍🏽👨‍👩‍👧 家族は大切です。今日は晴れ。 End';

ok('graphemes: skin-tone and family emoji are one character each', () => {
  assert.equal(t.graphemes('👍🏽👨‍👩‍👧é').length, 3); // é typed as e + combining accent
  assert.equal(t.graphemes(SAMPLE).length, 77); // wordcounter.net says 87 (UTF-16 units)
});
ok('words: Japanese split into words, emoji are not words (wordcounter.net: 13)', () => {
  assert.equal(t.countWords(SAMPLE), 18);
  assert.equal(t.countWords('家族は大切です。'), 4);
  assert.equal(t.countWords("don't stop — it's 3.50"), 4);
  assert.equal(t.countWords('   '), 0);
});
ok('sentences: "Mr." does not end a sentence, "Wait... what?" is one (wordcounter.net: 5)', () => {
  assert.equal(t.countSentences(SAMPLE), 6);
  assert.equal(t.countSentences('Dr. Who met Mrs. Jones at 5 p.m. yesterday. Then left.'), 2);
  assert.equal(t.countSentences(''), 0);
});
ok('sentence case: every sentence, pronoun I, acronyms and brand names kept', () => {
  assert.equal(t.sentenceCase('HELLO WORLD. THIS IS A TEST! is it working? yes. i think so.'),
    'Hello world. This is a test! Is it working? Yes. I think so.');
  assert.equal(t.sentenceCase('we went to NASA with my iPhone. i\'m happy'), "We went to NASA with my iPhone. I'm happy");
  assert.equal(t.sentenceCase('MR. SMITH WENT TO THE USA. HE LIKED IT.'), 'Mr. smith went to the USA. He liked it.');
  assert.equal(t.sentenceCase('first line\nsecond line'), 'First line\nSecond line');
});
ok('title case: minor words lower-case inside, first/last and after a colon capitalised', () => {
  assert.equal(t.titleCase('the lord of the rings and a tale of two cities: an end to it'),
    'The Lord of the Rings and a Tale of Two Cities: An End to It');
  assert.equal(t.titleCase("o'neil's well-known iPhone guide"), "O'Neil's Well-Known iPhone Guide");
  assert.equal(t.titleCase('what are you looking for'), 'What Are You Looking For');
  assert.equal(t.titleCase("don't stop"), "Don't Stop");
});
ok('capitalized case: every word', () => {
  assert.equal(t.capitalizedCase('the lord of the rings'), 'The Lord Of The Rings');
});
ok('reverse characters keeps emoji, flags and accents whole', () => {
  assert.equal(t.reverseCharacters('ab👍🏽🇫🇷é'), 'é🇫🇷👍🏽ba');
  assert.equal(t.reverseCharacters(t.reverseCharacters(SAMPLE)), SAMPLE);
});
ok('reverse words works line by line and keeps spacing', () => {
  assert.equal(t.reverseWords('one two  three\nfour five'), 'three two  one\nfive four');
  assert.equal(t.reverseWords('  a b '), '  b a ');
});
console.log(`\n${pass} passed`);
