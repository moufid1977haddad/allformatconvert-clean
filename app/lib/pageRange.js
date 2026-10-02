// "1-3, 5, 8-" → sorted page numbers within 1..n; throws a sentence the visitor can act on. Empty text = every page.
// Shared by PDF to Images (P21) and, since P24 (03/10), PDF Rotate, Delete Pages and Crop: Delete Pages read "2-4" as
// parseInt("2-4") = 2 and removed page 2 only, without a word; other words and pages past the end were dropped silently.
export function parsePageRange(text, n) {
  const t = String(text || '').trim();
  if (!t) return Array.from({ length: n }, (_, i) => i + 1);
  const pages = new Set();
  for (const part of t.split(/[,;\s]+/).filter(Boolean)) {
    const m = /^(\d*)\s*[-–]\s*(\d*)$/.exec(part) || /^(\d+)$/.exec(part);
    if (!m) throw new Error(`"${part}" is not a page or a range. Write pages like 1-3, 5, 8-.`);
    let a, b;
    if (m.length === 2) { a = b = Number(m[1]); } else { a = m[1] ? Number(m[1]) : 1; b = m[2] ? Number(m[2]) : n; }
    if (a < 1 || b < a) throw new Error(`"${part}" is not a valid range.`);
    if (a > n) throw new Error(`This PDF has ${n} page${n > 1 ? 's' : ''}: page ${a} does not exist.`);
    for (let p = a; p <= Math.min(b, n); p++) pages.add(p);
  }
  return [...pages].sort((x, y) => x - y);
}
