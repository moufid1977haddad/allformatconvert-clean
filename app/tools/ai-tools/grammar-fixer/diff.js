// Word-level diff between the visitor's text and the corrected one, grouped into changes the visitor can keep or
// undo one by one (LanguageTool's means: one card per correction, read 26/09/2026 -- here applied to the AI's
// rewrite). Undoing every change gives back the original exactly; keeping every one gives the correction exactly.

// Words (with inner apostrophes: don't, l’eau), runs of spaces, and single other characters.
const TOKEN = /[\p{L}\p{N}\p{M}]+(?:['’][\p{L}\p{N}\p{M}]+)*|\s+|[^\s\p{L}\p{N}\p{M}]/gu;
export const tokenize = (s) => s.match(TOKEN) || [];

// Myers' O(ND) diff on token arrays -> [['=', tok] | ['-', tok] | ['+', tok]]. null when more than maxD edits
// (a full rewrite: shown as one change).
function myers(a, b, maxD) {
  const n = a.length, m = b.length, max = n + m, off = max + 1;
  let v = new Int32Array(2 * max + 3); const trace = [];
  for (let d = 0; d <= Math.min(max, maxD); d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v[off + k] = x;
      if (x >= n && y >= m) return backtrack(trace, v, a, b, off, d);
    }
  }
  return null;
}
function backtrack(trace, vLast, a, b, off, dEnd) {
  const out = []; let x = a.length, y = b.length;
  for (let d = dEnd; d > 0; d--) {
    const v = trace[d]; const k = x - y;
    const prevK = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? k + 1 : k - 1;
    const px = v[off + prevK], py = px - prevK;
    while (x > px && y > py) { out.push(['=', a[--x]]); y--; }
    if (x === px) out.push(['+', b[--y]]); else out.push(['-', a[--x]]);
  }
  while (x > 0 && y > 0) { out.push(['=', a[--x]]); y--; }
  return out.reverse();
}

// -> segments: { same: text } | { id, from, to } (a change: `from` replaced by `to`, either may be '').
// A space alone between two changes is folded into them, so "have went" -> "went" is one change, not two.
export function changes(original, corrected, maxD = 1000) {
  const a = tokenize(original), b = tokenize(corrected);
  if (a.join('') !== original || b.join('') !== corrected) return [{ id: 0, from: original, to: corrected }];
  const ops = myers(a, b, maxD);
  if (!ops) return [{ id: 0, from: original, to: corrected }];
  const segs = [];
  for (const [op, t] of ops) {
    const last = segs.at(-1);
    if (op === '=') { if (last && 'same' in last) last.same += t; else segs.push({ same: t }); continue; }
    if (!last || 'same' in last) {
      // fold "change, whitespace, change" into one change
      const prev = segs.at(-2);
      if (last && /^\s+$/.test(last.same) && prev && !('same' in prev)) { segs.pop(); prev.from += last.same; prev.to += last.same; }
      else segs.push({ from: '', to: '' });
    }
    const c = segs.at(-1); if (op === '-') c.from += t; else c.to += t;
  }
  let id = 0; for (const s of segs) if (!('same' in s)) s.id = id++;
  return segs;
}

// The text with the changes whose id is in `undone` reverted to the original.
export const applyChoices = (segs, undone) => segs.map((s) => ('same' in s ? s.same : undone.has(s.id) ? s.from : s.to)).join('');
