// P37 (06/10): EPUB to PDF, the chapters of the reading order (spine), and the ones that cannot be read.
// @lingo-reader/epub-parser's loadChapter() never returns an empty value, so the page's "chapters that could not be
// read" counter was never reached:
//   - a chapter file missing from the ZIP gives an EMPTY chapter (the parser warns and reads 0 bytes), which came
//     out as a blank page in the PDF, without a word;
//   - a ZIP entry that cannot be inflated throws, which stopped the whole book.
// Both are now left out of the PDF and counted, and the page says how many are missing (as calibre's
// ebook-convert warns about a missing spine item and carries on).

// Names in the book's ZIP, lower-cased: the parser looks its files up without regard to case.
export const zipNameSet = (names) => new Set([...names].map((n) => String(n).toLowerCase()));

// The parser's spine href is "epub:" + the path of the file inside the ZIP.
export function chapterFileMissing(spineItem, zipNames) {
  const href = String(spineItem?.href || '').replace(/^epub:/, '');
  return !href || !zipNames.has(href.toLowerCase());
}

// Loads every spine chapter that can be read, in order. build(chapter) turns a loaded chapter into the HTML kept
// for the PDF. Returns { chaptersHtml, skipped }.
export async function loadReadableChapters({ ebook, spine, zipNames, build }) {
  const chaptersHtml = [];
  let skipped = 0;
  for (let i = 0; i < spine.length; i++) {
    if (chapterFileMissing(spine[i], zipNames)) { skipped++; continue; }
    let chapter;
    try {
      chapter = await ebook.loadChapter(spine[i].id);
    } catch {
      skipped++; // damaged entry (cannot be inflated, unreadable text): left out, counted
      continue;
    }
    if (!chapter) { skipped++; continue; }
    chaptersHtml.push(await build(chapter));
  }
  return { chaptersHtml, skipped };
}

// P37 follow-up (06/10): a spine <itemref> whose idref names no manifest item. The parser builds its spine with
// manifest[idref].href and no check, so initEpubFile() threw a raw TypeError ("Cannot read properties of undefined
// (reading 'href')") and the whole book stopped. calibre's ebook-convert warns about such a spine item and carries
// on. Before the parser sees the book, those itemrefs are taken out of the package file (the OPF) and counted, so the
// page says they are missing like any other unreadable chapter. A manifest item without an id, href or media-type is
// skipped by the parser (it warns), so an itemref naming one is taken out too.
const XML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const xmlUnescape = (s) => s.replace(/&(amp|lt|gt|quot|apos);/g, (_, n) => XML_ENTITIES[n]);
const attr = (tagText, name) => {
  const m = tagText.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));
  return m ? xmlUnescape(m[1] ?? m[2]) : null;
};
// The parser looks names up in the ZIP without regard to case.
const zipEntry = (zip, name) => {
  const lower = String(name).toLowerCase();
  const key = Object.keys(zip.files).find((n) => n.toLowerCase() === lower);
  return key ? zip.file(key) : null;
};

// zip: the book opened with JSZip. When the spine names unknown items, rewrites the OPF inside `zip` without them.
// Returns { removed: number of itemrefs taken out, kept: number left }; { removed: 0 } when the package cannot be
// read here (the parser then gives its own error, as before).
export async function dropUnknownSpineItems(zip) {
  const container = zipEntry(zip, 'META-INF/container.xml');
  if (!container) return { removed: 0, kept: null };
  const rootfile = (await container.async('string')).match(/<rootfile\b[^>]*>/);
  const opfPath = rootfile && attr(rootfile[0], 'full-path');
  const opfEntry = opfPath && zipEntry(zip, opfPath);
  if (!opfEntry) return { removed: 0, kept: null };
  const opf = await opfEntry.async('string');
  const ids = new Set();
  for (const m of opf.matchAll(/<item\s[^>]*>/g)) {
    const id = attr(m[0], 'id');
    if (id && attr(m[0], 'href') && attr(m[0], 'media-type')) ids.add(id);
  }
  let removed = 0, kept = 0;
  const fixed = opf.replace(/<itemref\s[^>]*?(?:\/>|>\s*<\/itemref>)/g, (tagText) => {
    const idref = attr(tagText, 'idref');
    if (!idref || ids.has(idref)) { if (idref) kept++; return tagText; } // no idref: the parser skips it already
    removed++;
    return '';
  });
  if (removed) zip.file(opfEntry.name, fixed);
  return { removed, kept };
}
