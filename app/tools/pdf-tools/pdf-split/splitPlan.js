// Which pages go into which output file -- pure, so it is unit-tested (scripts/pdf-split-tests/).
//
// The modes are iLovePDF's free ones, read on its page 2026-09-23 (docs/audit/RAPPORT-licence-et-ameliorations.md §5):
//   ranges  -- custom ranges "1-3, 5, 8-10", each its own PDF, or all merged into one
//   every   -- fixed ranges: a new PDF every N pages
//   all     -- extract every page as its own PDF
//   select  -- chosen pages, each its own PDF, or merged into one
// Anything that does not name real pages is refused with a reason -- the old tool turned "5-3" or "abc" into
// an empty PDF and called it a success.

// "1-3, 5, 8-" -> [[0,1,2],[4],[7..last]] (0-based), or { error }.
export function parseRanges(spec, total) {
  const parts = String(spec || '').split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { error: 'Type the pages to keep, for example 1-3, 5, 8-10.' };
  const groups = [];
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*(?:[-–]\s*(\d+)?)?$/);
    if (!m) return { error: `"${part}" is not a page or a range. Use numbers like 5 or 8-10.` };
    const a = parseInt(m[1], 10);
    const b = m[2] !== undefined ? parseInt(m[2], 10) : (part.includes('-') || part.includes('–') ? total : a);
    if (a < 1 || b < 1) return { error: 'Page numbers start at 1.' };
    if (a > total || b > total) return { error: `"${part}" goes past the last page: this PDF has ${total} page${total > 1 ? 's' : ''}.` };
    if (b < a) return { error: `"${part}" runs backwards. Write it as ${b}-${a}.` };
    groups.push({ label: a === b ? String(a) : `${a}-${b}`, pages: Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i) });
  }
  return { groups };
}

const span = (pages) => (pages.length === 1 ? String(pages[0] + 1) : `${pages[0] + 1}-${pages[pages.length - 1] + 1}`);

export function planSplit({ mode, spec, every, merge }, total) {
  if (!Number.isInteger(total) || total < 1) return { error: 'This PDF has no pages.' };
  let groups;
  if (mode === 'every') {
    const n = Number(every);
    if (!Number.isInteger(n) || n < 1) return { error: 'Enter a whole number of pages per file (1 or more).' };
    if (n >= total) return { error: `This PDF has ${total} page${total > 1 ? 's' : ''}: a file every ${n} pages would just be the same document.` };
    groups = [];
    for (let s = 0; s < total; s += n) {
      const pages = Array.from({ length: Math.min(n, total - s) }, (_, i) => s + i);
      groups.push({ label: span(pages), pages });
    }
  } else if (mode === 'all') {
    if (total === 1) return { error: 'This PDF has only one page: there is nothing to split.' };
    groups = Array.from({ length: total }, (_, i) => ({ label: String(i + 1), pages: [i] }));
  } else {
    const r = parseRanges(spec, total);
    if (r.error) return r;
    groups = r.groups;
    if (mode === 'select') groups = groups.flatMap((g) => g.pages.map((p) => ({ label: String(p + 1), pages: [p] })));
  }
  if (merge && (mode === 'ranges' || mode === 'select')) {
    const pages = groups.flatMap((g) => g.pages);
    return { files: [{ label: groups.map((g) => g.label).join(','), pages }] };
  }
  return { files: groups };
}

// "report.pdf" + "1-3" -> "report_1-3.pdf" (iLovePDF names its parts after the original, too).
export function partName(original, label) {
  const base = String(original || 'document').replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '_') || 'document';
  const safe = label.length > 60 ? label.slice(0, 57) + '…' : label;
  return `${base}_${safe.replace(/,/g, '+')}.pdf`;
}
