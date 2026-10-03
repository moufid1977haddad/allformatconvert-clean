// .odt/.ott written by Microsoft Word ("Save as OpenDocument Text") store each equation as a formula object whose
// MathML is "flat": the parts of the formula sit directly under <math>, with no <mrow> around them, and letters are
// Unicode mathematical alphanumerics (U+1D400-1D7FF: 𝑥, 𝜕, 𝛻 -- Word's math italic). LibreOffice lays such a <math>
// out as a vertical stack with an error mark ("¿") between the parts, and has no glyph for the alphanumerics in its
// formula fonts (measured P28, 04/10: Gotenberg 8.37 and LibreOffice 26 desktop alike; iLovePDF converts with Word
// itself and shows them right, Smallpdf drops them). MathML gives both a standard meaning: a single <mrow> holding the
// parts, and a base letter with mathvariant="italic|bold|bold-italic". This rewrites only formula objects that have no
// <semantics> (LibreOffice's own objects always carry one, with their StarMath source) -- everything else, and every
// file without such an object, is returned byte for byte.
import JSZip from 'jszip';

// Blocks of U+1D400-1D7FF that Word writes and LibreOffice's MathML import can style (normal, bold, italic,
// bold-italic): [first code point, count, mathvariant, greek?]. Latin blocks are A-Z then a-z (52), Greek blocks 58,
// digits 10. Script, fraktur, double-struck, sans-serif and monospace letters are NOT rewritten: LibreOffice would
// draw a plain letter (𝔼 as E, 𝟙 as 1) -- a plausible but wrong formula (independent review, P28).
const BLOCKS = [
  [0x1d400, 52, 'bold'], [0x1d434, 52, 'italic'], [0x1d468, 52, 'bold-italic'], [0x1d6a4, 2, 'italic'],
  [0x1d6a8, 58, 'bold', true], [0x1d6e2, 58, 'italic', true], [0x1d71c, 58, 'bold-italic', true],
  [0x1d7ca, 2, 'bold'], [0x1d7ce, 10, 'bold'],
];
// Greek block positions whose NFKC form is ANOTHER letter (NFKC folds the symbol variants: 𝜖 -> ε, 𝜙 -> φ), which
// physics tells apart: mapped explicitly to the symbol forms.
const GREEK_SYMBOLS = { 17: 'ϴ', 52: 'ϵ', 53: 'ϑ', 54: 'ϰ', 55: 'ϕ', 56: 'ϱ', 57: 'ϖ' };
const PLANCK = 0x210e; // ℎ, Word's italic h

// -> { base, variant } or null
function mapChar(ch) {
  const cp = ch.codePointAt(0);
  if (cp === PLANCK) return { base: 'h', variant: 'italic' };
  for (const [start, count, variant, greek] of BLOCKS) {
    if (cp < start || cp >= start + count) continue;
    const base = (greek && GREEK_SYMBOLS[cp - start]) || ch.normalize('NFKC');
    return base === ch ? null : { base, variant };
  }
  return null;
}

// Text of one token element -> { text, variant }, or null unless EVERY character (spaces aside) is a mathematical
// letter of one same style: a token mixing them with ordinary text ("if 𝑥") is left as it is.
function plainToken(text) {
  let variant = null;
  let out = '';
  for (const ch of text) {
    if (/\s/.test(ch)) { out += ch; continue; }
    const m = mapChar(ch);
    if (m === null || (variant !== null && variant !== m.variant)) return null;
    variant = m.variant;
    out += m.base;
  }
  return variant === null ? null : { text: out, variant };
}

const TOKEN = /<((?:[\w-]+:)?(?:mi|mo|mn|mtext|ms))(\s[^>]*)?>([^<]*)<\/\1>/g;

// One formula object's content.xml -> rewritten string, or null when untouched.
export function normalizeWordMathXml(xml) {
  if (/<(?:[\w-]+:)?semantics[\s>]/.test(xml)) return null;
  const root = /<((?:[\w-]+:)?math)(\s[^>]*)?>([\s\S]*)<\/\1>/.exec(xml);
  if (!root) return null;
  const [whole, tag, attrs = '', inner] = root;
  const prefix = tag.includes(':') ? tag.slice(0, tag.indexOf(':') + 1) : '';
  let body = inner;
  let changed = false;

  body = body.replace(TOKEN, (all, name, tattrs = '', text) => {
    const plain = plainToken(text);
    if (!plain) return all;
    changed = true;
    const local = name.slice(name.indexOf(':') + 1);
    // A single-letter <mi> is italic by default in MathML: the attribute is only needed for other styles.
    const implicit = local === 'mi' && plain.variant === 'italic' && [...plain.text].length === 1;
    const keep = /\smathvariant=/.test(tattrs) || implicit ? tattrs : `${tattrs} mathvariant="${plain.variant}"`;
    return `<${name}${keep}>${plain.text}</${name}>`;
  });

  // Element children directly under <math>: more than one -> wrap them in a single <mrow>.
  let depth = 0;
  let topLevel = 0;
  for (const m of body.matchAll(/<(\/?)[^>!?]*?(\/?)>/g)) {
    if (m[1]) depth -= 1;
    else if (m[2]) { if (depth === 0) topLevel += 1; }
    else { if (depth === 0) topLevel += 1; depth += 1; }
  }
  if (topLevel > 1) {
    body = `<${prefix}mrow>${body}</${prefix}mrow>`;
    changed = true;
  }
  if (!changed) return null;
  return xml.slice(0, root.index) + `<${tag}${attrs}>${body}</${tag}>` + xml.slice(root.index + whole.length);
}

// Returns { buffer, patched }: `patched` = number of formula objects rewritten (0 = buffer returned as-is). Throws if
// the archive cannot be read; the caller decides how to report it.
export async function normalizeWordMathInOdt(inputBuffer) {
  const zip = await JSZip.loadAsync(inputBuffer);
  const objects = zip.file(/^Object [^/]+\/content\.xml$/);
  let patched = 0;
  for (const entry of objects) {
    const next = normalizeWordMathXml(await entry.async('string'));
    if (next === null) continue;
    zip.file(entry.name, next);
    patched += 1;
  }
  if (patched === 0) return { buffer: inputBuffer, patched: 0 };
  // ODF: "mimetype" stays the first entry and uncompressed.
  const mimetype = zip.file('mimetype');
  if (mimetype) zip.file('mimetype', await mimetype.async('uint8array'), { compression: 'STORE' });
  const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return { buffer: out, patched };
}
