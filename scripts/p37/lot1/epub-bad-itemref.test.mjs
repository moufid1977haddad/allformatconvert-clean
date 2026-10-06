// P37 lot 1 follow-up -- EPUB to PDF: a spine <itemref> whose idref names no manifest item stopped the whole book with
// a raw TypeError ("Cannot read properties of undefined (reading 'href')"), thrown by the parser's parseSpine().
// calibre's ebook-convert warns about such a spine item and carries on: the page now does the same and counts it.
// Runs @lingo-reader/epub-parser (Node build: same parseSpine code as the browser build) on EPUBs built here with JSZip:
//   --legacy : the page as it was (the book handed to initEpubFile as is, then its chapter loop)
//   default  : the page now (app/lib/epubChapters.js: dropUnknownSpineItems, then loadReadableChapters)
//   node scripts/p37/lot1/epub-bad-itemref.test.mjs [--legacy]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import './ext-hook.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const legacy = process.argv.includes('--legacy');
const JSZip = (await import(pathToFileURL(path.join(ROOT, 'node_modules/jszip/lib/index.js')).href)).default;
const { initEpubFile } = await import(pathToFileURL(path.join(ROOT, 'node_modules/@lingo-reader/epub-parser/dist/index.node.mjs')).href);
const lib = await import(pathToFileURL(path.join(ROOT, 'app/lib/epubChapters.js')).href);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p37-epub-'));
const quiet = console.warn; console.warn = () => {}; // the parser warns about manifest items without a media-type

const chapter = (n) => `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Ch ${n}</title></head><body><h1>Chapter ${n}</h1><p>Words of chapter ${n}.</p></body></html>`;
// spine: the <itemref> elements as written in the OPF; manifestExtra: more <item> elements
async function epub(spine, manifestExtra = '') {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="utf-8"?>\r\n<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">p37</dc:identifier><dc:title>P37 book</dc:title><dc:language>en</dc:language></metadata>\r\n<manifest><item id="c1" href="ch1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="ch2.xhtml" media-type="application/xhtml+xml"/><item id='c&amp;3' href="ch3.xhtml" media-type="application/xhtml+xml"/>${manifestExtra}</manifest>\r\n<spine>\r\n${spine}\r\n</spine></package>`);
  for (const n of [1, 2, 3]) zip.file(`OEBPS/ch${n}.xhtml`, chapter(n));
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

// what the page does with the book, minus React and the PDF rendering
async function run(bytes) {
  let ebook;
  try {
    let book = bytes, removed = 0;
    const zip = await JSZip.loadAsync(bytes);
    if (!legacy) {
      const r = await lib.dropUnknownSpineItems(zip);
      if (r.removed && !r.kept) throw new Error('No readable chapters found in this file.');
      if (r.removed) book = await zip.generateAsync({ type: 'uint8array' });
      removed = r.removed;
    }
    ebook = await initEpubFile(book, path.join(tmp, 'res'));
    const spine = ebook.getSpine();
    if (!spine.length) throw new Error('No readable chapters found in this file.');
    const build = async (ch) => ch.html;
    const { chaptersHtml, skipped } = await lib.loadReadableChapters({ ebook, spine, zipNames: lib.zipNameSet(Object.keys(zip.files)), build });
    if (!chaptersHtml.length) throw new Error('No readable chapters found in this file.');
    return { chaptersHtml, skipped: skipped + removed };
  } catch (e) { return { error: e.message }; } finally { ebook?.destroy(); }
}
const pages = (r) => r.error ? `ERROR "${r.error}" (no PDF)` : r.chaptersHtml.map((h) => h.match(/Chapter \d/)?.[0] || 'BLANK PAGE').join(' | ') + ` ; counter: ${r.skipped} chapter(s) said missing`;
const chaptersAre = (r, list) => !r.error && r.chaptersHtml.map((h) => h.match(/Chapter (\d)/)?.[1]).join() === list;

let failed = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`); if (!ok) failed++; };
console.log(`mode: ${legacy ? 'BEFORE the fix (book handed to the parser as is)' : 'AFTER the fix (app/lib/epubChapters.js)'}`);

const intact = await run(await epub(`<itemref idref="c1"/><itemref idref="c2"/><itemref idref='c&amp;3'/>`));
check('intact book: 3 chapters, none said missing', chaptersAre(intact, '1,2,3') && intact.skipped === 0, pages(intact));
const bad = await run(await epub(`<itemref idref="c1"/><itemref idref="c9"/><itemref idref="c2"/><itemref idref='c&amp;3'/>`));
check('itemref to an unknown id: 3 chapters printed, 1 said missing', chaptersAre(bad, '1,2,3') && bad.skipped === 1, pages(bad));
const two = await run(await epub(`<itemref idref="nope"></itemref>\r\n<itemref idref="c1" linear="yes" /><itemref idref="c2"/><itemref idref="gone"/><itemref idref='c&amp;3'/>`));
check('two unknown ids (one written <itemref></itemref>): 3 chapters printed, 2 said missing', chaptersAre(two, '1,2,3') && two.skipped === 2, pages(two));
const noType = await run(await epub(`<itemref idref="c1"/><itemref idref="x1"/><itemref idref="c2"/>`, '<item id="x1" href="ch3.xhtml"/>'));
check('itemref to a manifest item without media-type (skipped by the parser): 2 printed, 1 said missing', chaptersAre(noType, '1,2') && noType.skipped === 1, pages(noType));
const allBad = await run(await epub(`<itemref idref="a"/><itemref idref="b"/>`));
check('every itemref unknown: the page says no readable chapters', allBad.error === 'No readable chapters found in this file.', pages(allBad));

console.warn = quiet;
fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS');
process.exitCode = failed ? 1 : 0;
