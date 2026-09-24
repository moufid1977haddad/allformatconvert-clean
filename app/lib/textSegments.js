// Text measured the way a reader sees it -- shared by Word Counter, Case Converter and Text Reverser.
//
// The reference sites split on spaces and count UTF-16 code units (measured 2026-09-23 on wordcounter.net,
// docs/audit/RAPPORT-licence-et-ameliorations.md §5): two Japanese sentences count as ONE word, a family
// emoji as 8 characters, "Mr." ends a sentence. Intl.Segmenter (ICU's Unicode segmentation, in every current
// browser) gives user-perceived characters (graphemes), dictionary words for Chinese/Japanese/Thai, and
// sentence boundaries; a short list of abbreviations fixes the one thing ICU gets wrong here ("Mr. Smith").

const hasSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
const seg = (granularity) => new Intl.Segmenter(undefined, { granularity });

export function graphemes(text) {
  if (hasSegmenter) return Array.from(seg('grapheme').segment(text), (s) => s.segment);
  return Array.from(text); // code points: keeps surrogate pairs whole (older browsers)
}

export function countWords(text) {
  if (!text.trim()) return 0;
  if (hasSegmenter) {
    let n = 0;
    // isWordLike alone is not enough: Firefox marks some kana segments (です, 晴れ) as not word-like, Chromium
    // does not -- measured 16 vs 18 words on the same text. Any segment holding a letter or digit is a word.
    for (const s of seg('word').segment(text)) if (s.isWordLike || /[\p{L}\p{N}]/u.test(s.segment)) n++;
    return n;
  }
  return (text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu) || []).length;
}

// Abbreviations after which ICU would wrongly start a new sentence (lower-cased, without the dot).
const ABBREVIATIONS = new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'mt', 'vs', 'etc', 'e.g', 'i.e', 'no', 'fig', 'approx', 'dept', 'inc', 'ltd', 'co', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec', 'u.s', 'a.m', 'p.m']);

// Sentences as [start, end) ranges over `text`.
export function sentenceRanges(text) {
  const out = [];
  if (hasSegmenter) {
    for (const s of seg('sentence').segment(text)) out.push([s.index, s.index + s.segment.length]);
  } else {
    const re = /[^.!?。！？]+(?:[.!?。！？]+|$)\s*/g; let m;
    while ((m = re.exec(text))) { if (!m[0]) { re.lastIndex++; continue; } out.push([m.index, m.index + m[0].length]); }
  }
  // Merge a range into the next when it ends with a known abbreviation ("Mr. " + "Smith paid…").
  const merged = [];
  for (const r of out) {
    const prev = merged[merged.length - 1];
    if (prev) {
      const tail = text.slice(prev[0], prev[1]).trimEnd();
      const m = tail.match(/(?:^|[\s(])([\p{L}.]+)\.$/u);
      if (m && ABBREVIATIONS.has(m[1].toLowerCase())) { prev[1] = r[1]; continue; }
    }
    merged.push([...r]);
  }
  return merged;
}

export function countSentences(text) {
  return sentenceRanges(text).filter(([a, b]) => /[\p{L}\p{N}]/u.test(text.slice(a, b))).length;
}

// ---- Case conversion ------------------------------------------------------------------------------

const WORD_RE = /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/gu;
const isMixedCase = (w) => /\p{Ll}/u.test(w.slice(1)) && /\p{Lu}/u.test(w.slice(1)); // iPhone, McDonald
const isAllCaps = (w) => /\p{Lu}/u.test(w) && !/\p{Ll}/u.test(w);
const cap = (w) => {
  const g = graphemes(w);
  return g.length ? g[0].toUpperCase() + g.slice(1).join('') : w;
};
// Acronyms kept in capitals even inside a shouted sentence (the reference keeps NASA, USA). Never words that
// are also ordinary English words in capitals (IT, US, WHO): those would stay shouted.
const ACRONYMS = new Set(['USA', 'UK', 'EU', 'UN', 'NASA', 'FBI', 'CIA', 'NATO', 'CEO', 'CFO', 'CTO', 'HR', 'PR', 'AI', 'API', 'PDF', 'URL', 'HTML', 'CSS', 'JSON', 'XML', 'SQL', 'HTTP', 'HTTPS', 'USB', 'GPS', 'PC', 'TV', 'DVD', 'CD', 'ID', 'FAQ', 'DIY', 'ASAP', 'BBC', 'CNN', 'NBA', 'NFL', 'OK', 'PhD', 'UNESCO', 'UNICEF', 'QR', 'SEO', 'SMS', 'VAT', 'GDP', 'DNA', 'RNA', 'COVID']);
// "I", "I'm", "I'll", "I've", "I'd" -- English first-person pronoun.
const isPronounI = (lower) => /^i(?:['’](?:m|ll|ve|d))?$/.test(lower);

function mostlyCaps(text) {
  const up = (text.match(/\p{Lu}/gu) || []).length, low = (text.match(/\p{Ll}/gu) || []).length;
  return up > low;
}

// Word as it should look in running text, before any sentence/title capitalisation.
function baseWord(w, shouting) {
  if (isMixedCase(w)) return w;                                // iPhone, McDonald, eBay: the author meant it
  if (isAllCaps(w) && w.length > 1) {
    if (ACRONYMS.has(w.replace(/['’]S$/, ''))) return w;
    if (!shouting) return w;                                    // NASA typed in normal text: an acronym
  }
  const lower = w.toLowerCase();
  if (isPronounI(lower)) return 'I' + lower.slice(1);
  return lower;
}

// Decided sentence by sentence: "HELLO WORLD." is shouting (lower-cased), NASA inside a normal sentence is an
// acronym (kept) -- the reference keeps a fixed list only.
export function sentenceCase(text) {
  let out = '';
  for (const [a, b] of sentenceRanges(text)) {
    const chunk = text.slice(a, b);
    const shouting = mostlyCaps(chunk);
    let s = chunk.replace(WORD_RE, (w) => baseWord(w, shouting));
    const m = s.match(/[\p{L}\p{N}]/u);
    if (m) s = s.slice(0, m.index) + s[m.index].toUpperCase() + s.slice(m.index + 1);
    out += s;
  }
  return out;
}

// Chicago-style minor words: lower-case inside a title.
const MINOR = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via', 'vs', 'from', 'into', 'onto', 'over', 'with']);

export function titleCase(text) {
  const shouting = mostlyCaps(text);
  const words = [...text.matchAll(WORD_RE)];
  let out = '', last = 0;
  words.forEach((m, k) => {
    const w = m[0], before = text.slice(last, m.index);
    // First word of the title, of a line, or after a colon / end of sentence / dash (a subtitle).
    const first = k === 0 || /\n/.test(before) || /[:.!?—–]["”'’)]?\s*["“'‘(]?$/.test(text.slice(0, m.index));
    const next = words[k + 1];
    const lastWord = !next || /[:.!?—–\n]/.test(text.slice(m.index + w.length, next.index));
    let v = baseWord(w, shouting);
    if (v === w && (isMixedCase(w) || (isAllCaps(w) && w.length > 1))) { /* kept as typed */ }
    else if (!first && !lastWord && MINOR.has(v)) { /* stays lower-case */ }
    else {
      v = cap(v);
      v = v.replace(/^([OD])(['’])(\p{L})/u, (_, p, q, c) => p + q + c.toUpperCase()); // O'Neil, D'Angelo
    }
    out += before + v;
    last = m.index + w.length;
  });
  out += text.slice(last);
  // Hyphenated compounds: each part capitalised (Well-Known, Real-Time), minor parts too, as Chicago does.
  return out.replace(/(\p{L})-(\p{Ll})/gu, (_, a, b) => `${a}-${b.toUpperCase()}`);
}

// Every word capitalised -- what our old "Title Case" did; the reference calls it "Capitalized Case".
export function capitalizedCase(text) {
  const shouting = mostlyCaps(text);
  return text.replace(WORD_RE, (w) => {
    const v = baseWord(w, shouting);
    return v === w && (isMixedCase(w) || isAllCaps(w)) ? w : cap(v);
  });
}

// ---- Reversal -------------------------------------------------------------------------------------

// Characters as the reader sees them: 👍🏽, 👨‍👩‍👧, é (e + accent) and 🇫🇷 stay whole.
export const reverseCharacters = (text) => graphemes(text).reverse().join('');
// Word order, line by line, keeping each line's own spacing pattern.
export const reverseWords = (text) => text.split('\n').map((line) => {
  const lead = line.match(/^\s*/)[0], trail = line.match(/\s*$/)[0];
  const core = line.trim();
  if (!core) return line;
  const parts = core.split(/(\s+)/);
  const words = parts.filter((_, i) => i % 2 === 0).reverse();
  const gaps = parts.filter((_, i) => i % 2 === 1);
  return lead + words.map((w, i) => w + (gaps[i] || '')).join('') + trail;
}).join('\n');
export const reverseLines = (text) => text.split('\n').reverse().join('\n');
