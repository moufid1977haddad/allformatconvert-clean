// P37 lot 1, bug 5 -- EPUB to PDF: a chapter file missing from the book came out as a blank page, and the
// "N chapters could not be read" counter was never reached (loadChapter() never returns an empty value).
// Runs @lingo-reader/epub-parser (its Node build: same EpubFile.loadChapter / readResource code as the browser build)
// on EPUBs built here with JSZip, then the page's chapter loop:
//   --legacy : the loop as it was in epub-to-pdf/page.jsx before P37 (copied below)
//   default  : app/lib/epubChapters.js, which the page now uses
// Cases: 3 chapters with the middle file missing from the ZIP; an intact book (regression); a book whose middle
// chapter is a damaged ZIP entry (deflate data overwritten).
//   node scripts/p37/lot1/epub-missing-chapter.test.mjs [--legacy]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import './ext-hook.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const legacy = process.argv.includes('--legacy');
const JSZip = (await import(pathToFileURL(path.join(ROOT, 'node_modules/jszip/lib/index.js')).href)).default;
const { initEpubFile } = await import(pathToFileURL(path.join(ROOT, 'node_modules/@lingo-reader/epub-parser/dist/index.node.mjs')).href);
const lib = legacy ? null : await import(pathToFileURL(path.join(ROOT, 'app/lib/epubChapters.js')).href);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p37-epub-'));
const quiet = console.warn; console.warn = () => {}; // the parser warns about the missing file

const chapter = (n, text) => `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Ch ${n}</title></head><body><h1>Chapter ${n}</h1><p>${text}</p></body></html>`;
async function epub({ missing = false, damaged = false } = {}) {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">p37</dc:identifier><dc:title>P37 book</dc:title><dc:language>en</dc:language></metadata><manifest><item id="c1" href="ch1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="ch2.xhtml" media-type="application/xhtml+xml"/><item id="c3" href="ch3.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/><itemref idref="c2"/><itemref idref="c3"/></spine></package>`);
  zip.file('OEBPS/ch1.xhtml', chapter(1, 'First words.'));
  if (!missing) zip.file('OEBPS/ch2.xhtml', chapter(2, 'Middle words. '.repeat(400)), { compression: 'DEFLATE' });
  zip.file('OEBPS/ch3.xhtml', chapter(3, 'Last words.'));
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  if (damaged) { // overwrite the middle of ch2's deflate stream with an invalid block type (0b11)
    const name = Buffer.from('OEBPS/ch2.xhtml');
    const at = Buffer.from(bytes).indexOf(name) + name.length; // local header file name, then the data
    for (let i = at + 2; i < at + 40; i++) bytes[i] = 0xff;
  }
  return bytes;
}

// the page's loop before P37
async function legacyLoop(ebook, spine, build) {
  const chaptersHtml = [];
  let skippedCount = 0;
  for (let i = 0; i < spine.length; i++) {
    const ch = await ebook.loadChapter(spine[i].id);
    if (!ch) { skippedCount++; continue; }
    chaptersHtml.push(await build(ch));
  }
  return { chaptersHtml, skipped: skippedCount };
}

async function run(bytes) {
  const ebook = await initEpubFile(bytes, path.join(tmp, 'res'));
  const spine = ebook.getSpine();
  const build = async (ch) => ch.html; // buildChapterHtml only inlines blob: resources; these chapters have none
  try {
    if (legacy) return await legacyLoop(ebook, spine, build);
    const zip = await JSZip.loadAsync(bytes);
    return await lib.loadReadableChapters({ ebook, spine, zipNames: lib.zipNameSet(Object.keys(zip.files)), build });
  } catch (e) { return { error: e.message }; } finally { ebook.destroy(); }
}
// what the PDF would show: buildFullDocument wraps each chapter in a page-break div
const pages = (r) => r.error ? `ERROR "${r.error}" (no PDF)` : r.chaptersHtml.map((h) => (h.replace(/<[^>]+>/g, '').trim() ? h.match(/Chapter \d/)?.[0] : 'BLANK PAGE')).join(' | ') + ` ; counter: ${r.skipped} chapter(s) said missing`;

let failed = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`); if (!ok) failed++; };
console.log(`mode: ${legacy ? 'BEFORE the fix (page loop as it was)' : 'AFTER the fix (app/lib/epubChapters.js)'}`);
const intact = await run(await epub());
check('intact book: 3 chapters, none said missing', !intact.error && intact.chaptersHtml.length === 3 && intact.skipped === 0, pages(intact));
const miss = await run(await epub({ missing: true }));
check('chapter 2 file missing: no blank page, 1 chapter said missing', !miss.error && miss.chaptersHtml.length === 2 && miss.chaptersHtml.every((h) => h.replace(/<[^>]+>/g, '').trim()) && miss.skipped === 1, pages(miss));
const dmg = await run(await epub({ damaged: true }));
check('chapter 2 damaged in the ZIP: the other chapters printed, 1 said missing', !dmg.error && dmg.chaptersHtml.length === 2 && dmg.skipped === 1, pages(dmg));
console.warn = quiet;
fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS');
process.exitCode = failed ? 1 : 0;
