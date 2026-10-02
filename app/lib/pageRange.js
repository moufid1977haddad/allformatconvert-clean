// "1-3, 5, 8-" → sorted page numbers within 1..n; throws a sentence the visitor can act on. Empty text = every page.
// Shared by PDF to Images (P21) and, since P24 (03/10), PDF Rotate, Delete Pages and Crop: Delete Pages read "2-4" as
// parseInt("2-4") = 2 and removed page 2 only, without a word; other words and pages past the end were dropped silently.
export function parsePageRange(text, n) {
  // spaces around a dash belong to the range: "1 - 3" was split into "1", "-", "3" and the lone "-" meant every page
  const t = String(text || '').trim().replace(/\s*[-–]\s*/g, '-');
  if (!t) return Array.from({ length: n }, (_, i) => i + 1);
  const pages = new Set();
  for (const part of t.split(/[,;\s]+/).filter(Boolean)) {
    const m = /^(\d*)\s*[-–]\s*(\d*)$/.exec(part) || /^(\d+)$/.exec(part);
    if (!m || part === '-') throw new Error(`"${part}" is not a page or a range. Write pages like 1-3, 5, 8-.`);
    let a, b;
    if (m.length === 2) { a = b = Number(m[1]); } else { a = m[1] ? Number(m[1]) : 1; b = m[2] ? Number(m[2]) : n; }
    if (a < 1 || b < a) throw new Error(`"${part}" is not a valid range.`);
    if (a > n) throw new Error(`This PDF has ${n} page${n > 1 ? 's' : ''}: page ${a} does not exist.`);
    for (let p = a; p <= Math.min(b, n); p++) pages.add(p);
  }
  return [...pages].sort((x, y) => x - y);
}

// P24 review (03/10): the same reading, keeping the ORDER written ("3, 1-2" = 3, 1, 2; "5-3" = 5, 4, 3) and repeats,
// for Reorder Pages, which read "3-5" as 3 (parseInt) and dropped words and pages past the end without a word.
export function parsePageOrder(text, n) {
  const t = String(text || '').trim().replace(/\s*[-–]\s*/g, '-');
  if (!t) throw new Error('Write the new order of the pages, like 3, 1, 2 or 5-1.');
  const out = [];
  for (const part of t.split(/[,;\s]+/).filter(Boolean)) {
    const m = /^(\d+)-(\d+)$/.exec(part) || /^(\d+)$/.exec(part);
    if (!m) throw new Error(`"${part}" is not a page or a range. Write pages like 3, 1, 2 or 5-1.`);
    const a = Number(m[1]), b = m.length === 3 ? Number(m[2]) : a;
    for (const p of [a, b]) {
      if (p < 1) throw new Error(`"${part}": pages start at 1.`);
      if (p > n) throw new Error(`This PDF has ${n} page${n > 1 ? 's' : ''}: page ${p} does not exist.`);
    }
    if (a <= b) for (let p = a; p <= b; p++) out.push(p); else for (let p = a; p >= b; p--) out.push(p);
  }
  return out;
}
