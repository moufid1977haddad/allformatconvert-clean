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

export function planSplit({ mode, spec, every, merge, bookmarks = [], level = 1 }, total) {
  if (!Number.isInteger(total) || total < 1) return { error: 'This PDF has no pages.' };
  let groups;
  if (mode === 'bookmarks') {
    // P24 (03/10): one file per bookmark, from its page to the page before the next bookmark (Sejda, PDF24). Bookmarks
    // on the same page share one file (the first title names it); pages before the first bookmark get their own file,
    // so no page is dropped. Out-of-order bookmarks are read in page order.
    const marks = bookmarks.filter((b) => b.depth <= level && Number.isInteger(b.page) && b.page >= 0 && b.page < total).sort((a, b) => a.page - b.page);
    const starts = [];
    for (const m of marks) if (!starts.length || starts[starts.length - 1].page !== m.page) starts.push(m);
    if (!starts.length) return { error: bookmarks.length ? 'None of this PDF\'s bookmarks at this level points to a page.' : 'This PDF has no bookmarks. Use Custom ranges instead.' };
    if (starts.length === 1 && starts[0].page === 0) return { error: 'This PDF has a single bookmark, on page 1: splitting by it would give the same document.' };
    groups = [];
    const width = String(starts.length + 1).length;
    if (starts[0].page > 0) groups.push({ label: '0'.padStart(width, '0') + ' (before the first bookmark)', pages: Array.from({ length: starts[0].page }, (_, i) => i) });
    starts.forEach((m, k) => {
      const end = k + 1 < starts.length ? starts[k + 1].page : total;
      groups.push({ label: `${String(k + 1).padStart(width, '0')} ${m.title}`, pages: Array.from({ length: end - m.page }, (_, i) => m.page + i), title: m.title });
    });
  } else if (mode === 'every') {
    const n = Number(every);
    if (!Number.isInteger(n) || n < 1) return { error: 'Enter a whole number of pages per file (1 or more).' };
    if (n >= total) return { error: `This PDF has ${total} page${total > 1 ? 's' : ''}: a file every ${n} pages would just be the same document.` };
    groups = [];
    for (let s = 0; s < total; s += n) {
      const pages = Array.from({ length: Math.min(n, total - s) }, (_, i) => s + i);
      groups.push({ label: span(pages), pages });
    }
  } else if (mode === 'oddeven') {
    // P24 (03/10): odd pages in one PDF, even pages in another (Sejda; printing a booklet on one-sided printers)
    if (total === 1) return { error: 'This PDF has only one page: there are no even pages.' };
    groups = [
      { label: 'odd', pages: Array.from({ length: Math.ceil(total / 2) }, (_, i) => i * 2) },
      { label: 'even', pages: Array.from({ length: Math.floor(total / 2) }, (_, i) => i * 2 + 1) },
    ];
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
  // a bookmark title can hold / : ? … (P24): made safe like the original name, or the part's name was not a valid file name
  const clean = String(label).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, ' ').trim() || 'part';
  const safe = clean.length > 60 ? clean.slice(0, 57) + '…' : clean;
  return `${base}_${safe.replace(/,/g, '+')}.pdf`;
}
