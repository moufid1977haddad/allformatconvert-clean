// Line and character helpers for the text tools (29/09).
//
// Measured before (scripts/converter-tests/06-text-tools.mjs replays each case):
//   - Character Counter: "😀" counted 2 characters, "café" 3 letters + 1
//     "special character" (letters were A-Z only);
//   - Duplicate Remover: with Windows line endings the last line never matched
//     its duplicate ("a\r" vs "a");
//   - Text Sorter: plain code-unit order -- "Banana" before "apple", "éclair"
//     after "zebra", "10" before "9";
//   - Text Truncator: could cut an emoji in half (a lone surrogate "�"), and
//     "words" ignored line breaks;
//   - Lorem Ipsum: "5 sentences" gave 5 whole paragraphs, and more than 69
//     words were silently capped at 69;
//   - Find & Replace: in plain-text mode, "$&", "$1" or "$$" in the
//     replacement were interpreted as regex patterns ("US$$" became "US$").
import { graphemes } from './textSegments.js';

export const splitLines = (text) => text.split(/\r\n|\r|\n/);

export function countCharacters(text) {
  const g = graphemes(text);
  let letters = 0, digits = 0, spaces = 0, other = 0;
  for (const c of g) {
    if (/^\p{L}/u.test(c)) letters++;
    else if (/^\p{N}/u.test(c)) digits++;
    else if (/^\s/u.test(c)) spaces++;
    else other++;
  }
  return {
    characters: g.length,
    charactersNoSpaces: g.length - spaces,
    letters, digits, spaces, other,
    utf16Units: text.length,
    utf8Bytes: new TextEncoder().encode(text).length,
    lines: text === '' ? 0 : splitLines(text).length,
  };
}

export function removeDuplicateLines(text, { caseSensitive = true, trim = false, removeEmpty = false } = {}) {
  const seen = new Set();
  const out = [];
  let removed = 0;
  for (const line of splitLines(text)) {
    // P24 review (03/10): "é" typed as one character or as e + accent (macOS, copied text) is the same line
    let key = (trim ? line.trim() : line).normalize('NFC');
    if (!caseSensitive) key = key.toLocaleLowerCase();
    if (removeEmpty && line.trim() === '') { removed++; continue; }
    if (seen.has(key)) { removed++; continue; }
    seen.add(key);
    out.push(line);
  }
  return { text: out.join('\n'), removed };
}

// Alphabetical like a dictionary: case-insensitive first, accents after their
// base letter, and numbers compared by value (2 < 10), as natural-sort tools do.
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const tieBreak = new Intl.Collator(undefined, { numeric: true, sensitivity: 'variant' });
const compare = (a, b) => collator.compare(a, b) || tieBreak.compare(a, b);

export function sortLines(text, mode) {
  const lines = splitLines(text);
  if (mode === 'az') return lines.sort(compare).join('\n');
  if (mode === 'za') return lines.sort((a, b) => compare(b, a)).join('\n');
  if (mode === 'length') return lines.sort((a, b) => graphemes(a).length - graphemes(b).length || compare(a, b)).join('\n');
  // P24 review (03/10): natural order compares digit runs, not values: 1.5 / 1.25 / 1.3 gave 1.3, 1.5, 1.25 and -10 / -2
  // gave -2, -10. "By number" reads the number each line starts with (sign, decimals, exponent); lines without one
  // follow, in A-Z order.
  if (mode === 'number' || mode === 'number-desc') {
    const lead = (s) => { const m = /^\s*([-+−]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)/.exec(s); return m ? Number(m[1].replace('−', '-')) : NaN; };
    const nums = lines.filter((l) => Number.isFinite(lead(l))), rest = lines.filter((l) => !Number.isFinite(lead(l)));
    const dir = mode === 'number' ? 1 : -1;
    nums.sort((a, b) => dir * (lead(a) - lead(b)) || compare(a, b));
    return [...nums, ...rest.sort(compare)].join('\n');
  }
  throw new Error(`Unknown sort mode ${mode}`);
}

// Keeps at most `limit` characters (user-perceived) or words; the ellipsis is
// added after the kept part and reported separately so the count stays exact.
export function truncate(text, limit, type, ellipsis = '...') {
  if (!Number.isInteger(limit) || limit < 0) throw new Error('The limit must be a whole number, 0 or more.');
  if (type === 'characters') {
    const g = graphemes(text);
    return g.length > limit ? g.slice(0, limit).join('').replace(/\s+$/u, '') + ellipsis : text;
  }
  // words: cut after the limit-th word, keeping the original spacing and line breaks
  const re = /\S+/gu;
  let m, n = 0;
  while ((m = re.exec(text))) {
    n++;
    if (n === limit) {
      const end = m.index + m[0].length;
      return text.slice(end).trim() ? text.slice(0, end) + ellipsis : text;
    }
  }
  return limit === 0 && text.trim() ? ellipsis : text;
}

const LOREM_WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum').split(' ');
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Deterministic word stream: the classic passage, then repeated, so any count
// is honoured (the old version stopped at 69 words without saying so).
function words(n, offset = 0) {
  return Array.from({ length: n }, (_, i) => LOREM_WORDS[(offset + i) % LOREM_WORDS.length]);
}
function sentence(k) {
  const len = 8 + ((k * 7) % 9); // 8-16 words
  const w = words(len, k * 11);
  if (k === 0) { w[0] = 'lorem'; w[1] = 'ipsum'; }
  return cap(w.join(' ')) + '.';
}
export function lorem(count, type) {
  if (!Number.isInteger(count) || count < 1) throw new Error('Enter a whole number of 1 or more.');
  if (type === 'words') { const w = words(count); return cap(w.join(' ')) + '.'; }
  if (type === 'sentences') return Array.from({ length: count }, (_, k) => sentence(k)).join(' ');
  return Array.from({ length: count }, (_, p) => Array.from({ length: 5 }, (_, k) => sentence(p * 5 + k)).join(' ')).join('\n\n');
}

export function literalReplaceAll(text, find, replacement) {
  if (!find) return { text, count: 0 };
  const parts = text.split(find);
  return { text: parts.join(replacement), count: parts.length - 1 };
}

// Whitespace Remover (P20, 01/10). "Remove All Extra" used to collapse every
// whitespace run, line breaks included, so a list or a poem came back as one
// line. The market keeps line breaks in every "extra spaces" mode and names
// the joining mode explicitly (charactercalculator.com "Remove all
// whitespaces", convertiful.com "Flatten Text (Remove Line Breaks)",
// removespaces.org and openl.io "preserves line breaks"). Horizontal
// whitespace = anything \s matches except line breaks, so the non-breaking
// spaces of text copied from web pages and PDFs are collapsed too.
const HORIZONTAL_WS = /[^\S\r\n]+/g;
const collapseLine = (line) => line.replace(HORIZONTAL_WS, ' ').trim();

// Every line kept (blank lines too); repeated spaces/tabs inside a line become
// one space; spaces at the start and end of each line go.
export const removeExtraSpaces = (text) => splitLines(text).map(collapseLine).join('\n');

// Same, plus the extra blank lines: a run of blank lines becomes one (the
// paragraph break stays), blank lines before the first and after the last
// line go. No line with content is ever removed or joined.
export function removeAllExtraWhitespace(text) {
  const out = [];
  for (const line of splitLines(text).map(collapseLine)) {
    if (line === '' && (out.length === 0 || out[out.length - 1] === '')) continue;
    out.push(line);
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

// The old "Remove All Extra", now under a name that says it: everything on one line.
export const joinIntoOneLine = (text) => text.replace(/\s+/g, ' ').trim();

export const removeLeadingWhitespace = (text) => splitLines(text).map((l) => l.trimStart()).join('\n');
export const removeTrailingWhitespace = (text) => splitLines(text).map((l) => l.trimEnd()).join('\n');
