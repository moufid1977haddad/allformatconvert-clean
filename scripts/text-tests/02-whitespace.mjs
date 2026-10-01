// Whitespace Remover: every button does what its label says, no line lost (P20).
// Run: node scripts/text-tests/02-whitespace.mjs
import assert from 'node:assert/strict';
import * as t from '../../app/lib/textTools.js';

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log('PASS', name); };
const POEM = '  Roses   are\tred,  \n\n\n   Violets  are blue.\r\n\n  Sugar is   sweet  \n\n';

ok('Remove Extra Spaces: every line kept, spaces collapsed and trimmed', () => {
  assert.equal(t.removeExtraSpaces(POEM), 'Roses are red,\n\n\nViolets are blue.\n\nSugar is sweet\n\n');
  assert.equal(t.removeExtraSpaces(POEM).split('\n').length, POEM.split(/\r\n|\n/).length);
});
ok('Remove All Extra: lines kept, blank-line runs become one, ends trimmed', () => {
  assert.equal(t.removeAllExtraWhitespace(POEM), 'Roses are red,\n\nViolets are blue.\n\nSugar is sweet');
  assert.equal(t.removeAllExtraWhitespace('a\nb\nc'), 'a\nb\nc');
  assert.equal(t.removeAllExtraWhitespace('\n\n  \n'), '');
});
ok('Join Into One Line: the old behaviour, now named', () => {
  assert.equal(t.joinIntoOneLine(POEM), 'Roses are red, Violets are blue. Sugar is sweet');
});
ok('Remove Leading / Trailing: only that side of each line', () => {
  assert.equal(t.removeLeadingWhitespace(' a \n\t b\t'), 'a \nb\t');
  assert.equal(t.removeTrailingWhitespace(' a \n\t b\t'), ' a\n\t b');
});
console.log(`${pass} passed`);
