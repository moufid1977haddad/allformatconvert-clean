'use client';
import { pdfFileProblem, pdfLockedProblem } from '../../../lib/fileChecks';
import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { matchSpans, annotationText, patternSpans, annotationMatches, termsOf, PATTERNS, redactionQuads, textLayerWords, drawInvisibleWords, standardWidthOf, glyphTermQuads, glyphTermMatches, confirmedTermSpans, readingOrderHit, unreadableShare, UNREADABLE_SHARE, removeInvisibleWords, visibleTermLeft, invisibleTextFont, hasArabic, pageGlyphGeometry, pageGlyphs, itemGeometry, canvasInk } from '../../../lib/pdfRedact';
import { loadPdfjs } from '../../../lib/pdfjs';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';
import { withActualTextUnicode } from '../../../lib/pdfActualText';
import { fitScale, withTimeout, StepTimeout } from '../../../lib/canvasLimit'; // P31: one canvas cap for iPhone / iPad
import { serverRenderAvailable, ServerPageRenderer, LOCAL_PAGE_LIMIT_MS, LOCAL_PAGE_LIMIT_LABEL, listPages, STAGED_MAX_BYTES } from '../../../lib/serverPageRender';
import { sanitizeForCopy, verifyRedacted, relinkDestinations, UNREADABLE_ANNOTATIONS } from '../../../lib/redactSanitize';

// P32 (04/10): a page drawn by our PDF service comes with the page's /Rotate applied (pdftoppm); the redaction works
// on the unrotated page (rotation 0 viewport, rotation set back on the new page), so the image is turned back here.
// the device does not change while the page is open: nothing to subscribe to (useSyncExternalStore reads it once on
// the client, false in the server render, so hydration matches)
const noSubscribe = () => () => {};

// P33 (05/10): real iPhone pass of 04/10 (iOS 26) — kit-iphone-p21/pdf-avec-images.pdf, "photo-2", "Redact PDF": no
// file, no message, no error. Playwright's WebKit and Chromium (iPhone) redact the same file in ~2 s, and no request
// reached /api/pdf-render or /api/report-error during the owner's test (Vercel logs), so the page never got to the
// 20-second drawing fallback nor showed an error. The page now always answers: every step says where it is
// ("Page 2 of 3: reading its text…"), a step with no progress for STEP_LIMIT_MS stops with a sentence naming it (and
// that sentence reaches tool_errors, so the next real failure tells us which step it was), and the result or the
// message is scrolled into view (on a phone it appeared under the keyboard / below the fold).
const STEP_LIMIT_MS = () => (typeof window !== 'undefined' && window.__redactStepLimitMs) || 60000;
const quoteTerms = (terms) => terms.map((t) => `“${t}”`).join(', ');

// P37 (06/10): the Arabic words outside the black boxes stay selectable too. Their invisible text is written in Noto
// Sans Arabic (SIL Open Font License 1.1, public/fonts/noto/OFL.txt, the face Text to PDF already uses), downloaded only
// when a redacted page keeps an Arabic word, and subset to the characters written.
const ARABIC_FONT_URL = '/fonts/noto/NotoSansArabic-Regular.ttf';
async function loadArabicFont(doc, lib) {
  // @pdf-lib/fontkit's build calls a global regeneratorRuntime (Babel generators), as in app/lib/textPdf.js
  if (typeof globalThis.regeneratorRuntime === 'undefined') globalThis.regeneratorRuntime = (await import('regenerator-runtime')).default;
  const fontkit = (await import('@pdf-lib/fontkit')).default;
  const r = await fetch(ARABIC_FONT_URL);
  if (!r.ok) throw new Error(`the Arabic font could not be downloaded (HTTP ${r.status})`);
  return invisibleTextFont(doc, fontkit.create(new Uint8Array(await r.arrayBuffer())), lib);
}

function drawUnrotated(ctx, img, W, H, rot) {
  ctx.save();
  if (rot === 90) { ctx.translate(0, H); ctx.rotate(-Math.PI / 2); ctx.drawImage(img, 0, 0, H, W); }
  else if (rot === 180) { ctx.translate(W, H); ctx.rotate(Math.PI); ctx.drawImage(img, 0, 0, W, H); }
  else if (rot === 270) { ctx.translate(W, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(img, 0, 0, H, W); }
  else ctx.drawImage(img, 0, 0, W, H);
  ctx.restore();
}

export default function Page() {
  const [file, setFile] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [kinds, setKinds] = useState([]); // P24: automatic patterns (e-mail, phone, card numbers)
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const [summary, setSummary] = useState('');
  const [progress, setProgress] = useState('');
  const fileRef = useRef();
  const resultRef = useRef(null);
  // P33: the outcome (file row, summary or message) is brought into view when it appears
  useEffect(() => {
    if ((summary || error) && resultRef.current && resultRef.current.scrollIntoView) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [summary, error]);
  // P32: the notice of the iPhone / iPad fallback, read after mounting (the server render does not know the device)
  const onAppleTouch = useSyncExternalStore(noSubscribe, serverRenderAvailable, () => false);

  const handleFile = async (e) => { const f = e.target.files[0]; e.target.value = ''; setResult(null); setSummary(''); setError(''); if (!f) return; const problem = (await pdfFileProblem(f)) || (await pdfLockedProblem(f)); if (problem) { setFile(null); setError(problem); return; } setFile(f); }; // P21: a bad file is said when it is chosen

  const redact = async () => {
    let sentToServer = false; // P32: said even if the service then fails (review 04/10)
    const terms = termsOf(keyword);
    if (!file || (!terms.length && !kinds.length)) return;
    setLoading(true);
    setError('');
    setSummary('');
    setResult(null);
    setProgress('Opening the PDF...');
    const limit = STEP_LIMIT_MS();
    const step = (promise, what, onTimeout) => withTimeout(promise, limit, `${what} made no progress for ${Math.round(limit / 1000)} seconds on this device. Try again; if it happens again, use a computer for this PDF.`, onTimeout);
    try {
      const lib = await import('pdf-lib');
      const { PDFDocument, degrees } = lib;
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await step(PDFDocument.load(await openablePdfBytes(arrayBuffer)), 'Opening the PDF');
      const outDoc = await PDFDocument.create();
      const loadingTask = pdfjsLib.getDocument({ data: await withActualTextUnicode(arrayBuffer) });
      const pdf = await step(loadingTask.promise, 'Opening the PDF', () => loadingTask.destroy());
      const scale = 2;
      const canFallBack = serverRenderAvailable();
      let renderer = null;
      let remote = false;
      const drawnByServer = [];
      try {
      let totalMatches = 0;
      const pagesHit = [];
      const perPage = []; // [page, occurrences]
      const found = new Map(); // page index → { page, content, items, spans, boxes }
      const measure = document.createElement('canvas').getContext('2d');
      // P37 final check (reviews 3 to 5): each term as typed in the text (always), its lam-alef forms where the run draws
      // that ligature (confirmedTermSpans), the terms still DRAWN in drawing order (glyphTermMatches) and in the reading
      // order rebuilt from the glyphs (readingOrderHit: a Latin word inside Arabic, a phrase wrapped onto the next line) —
      // not every permuted form ("سالم", another name, on another page made a "سلام" redaction refused). The glyphs of each
      // page are read once.
      const glyphCache = new WeakMap();
      const glyphsOf = async (pg) => { if (!glyphCache.has(pg)) glyphCache.set(pg, pageGlyphs(pg, pdfjsLib).catch(() => null)); return glyphCache.get(pg); };
      const textMatches = async (strs, eols, pg, its) => (its ? confirmedTermSpans(its, terms, pg && terms.length ? await glyphsOf(pg) : null).length > 0 : terms.some((t) => matchSpans(strs, t, { forms: 'exact' }).length)) || patternSpans(strs, kinds, eols).length > 0;
      // P35: the matches among the words kept on a redacted page, read as one line (no line end: the most matches)
      const spansOf = (strs) => [...terms.flatMap((t) => matchSpans(strs, t)), ...patternSpans(strs, kinds)];
      let helvetica = null;
      let arabicFont = null, arabicFontProblem = '';
      let inkCanvas = null, drawnInk = null;
      // P37 sixth review (L5): pages part of whose text cannot be read (glyphs without readable letters: a broken text
      // encoding, common in some Arabic PDFs) — said in the summary and in "No match found", never silently
      const unreadablePages = [];
      const layered = new Map(); // page number → the rebuilt page (with its invisible words)
      const stillVisible = []; // P37 S1: blacked-out pages where a term can still be read outside the boxes
      const unreadableNote = () => (unreadablePages.length ? ` ${unreadablePages.length > 1 ? 'Pages' : 'Page'} ${listPages(unreadablePages)}: part of the text cannot be read (the PDF does not say which letters some of its characters are), so a term there may not be found. Check ${unreadablePages.length > 1 ? 'these pages' : 'this page'}, or run PDF OCR first.` : '');

      // Pass 1 (P33): every page is searched BEFORE anything is copied — the pages without a match are then copied from
      // a source in which the redacted pages are empty shells (app/lib/redactSanitize.js, independent review 05/10).
      for (let i = 0; i < pdf.numPages; i++) {
        const where = `Page ${i + 1} of ${pdf.numPages}`;
        setProgress(`${where}: reading its text...`);
        const page = await step(pdf.getPage(i + 1), `${where}: opening the page`);
        const content = await step(page.getTextContent(), `${where}: reading its text`);
        const items = content.items.filter((it) => typeof it.str === 'string');
        const strs = items.map((it) => it.str);
        const eols = items.map((it) => !!it.hasEOL);
        // P37 second review (N5): the text is searched for the terms as typed; the forms PDF.js misreads (a lam-alef
        // reversed, a right-to-left run in drawing order) are found in the glyphs below, where the drawing shows them
        // P37 second review (N4): the terms are also searched in the glyphs the page draws (PDF.js can read a right-to-
        // left phrase out of order, or its lam-alef reversed). Not read within 20 s: the final check reads it again.
        let glyphs = null, drawnHits = 0;
        if (terms.length) {
          try {
            glyphs = await withTimeout(pageGlyphs(page, pdfjsLib), 20000, 'timeout');
            drawnHits = glyphTermMatches(glyphs, terms).length;
            // P37 sixth review (L5): a page part of whose text cannot be read is named to the visitor
            const u = unreadableShare(glyphs);
            if (u.share > UNREADABLE_SHARE && u.bad >= 3) unreadablePages.push(i + 1);
          } catch (e) { console.warn(`[pdf-redact] page ${i + 1}: glyphs not read (${e?.message})`); }
        }
        // the terms as typed in the text, their lam-alef forms where the run draws that ligature (app/lib/pdfRedact.js
        // confirmedTermSpans), and the patterns
        const spans = [...confirmedTermSpans(items, terms, glyphs), ...patternSpans(strs, kinds, eols)];
        // Form field values, comments, link addresses… are searched too (29/09, P33).
        const all = await step(page.getAnnotations(), `${where}: reading its form fields and comments`);
        const annots = all.filter((an) => an.rect && annotationMatches(annotationText(an), terms, kinds));
        // P37 third review (R3): a page without a match frees what PDF.js keeps for it (its operator list: memory on
        // iPhone, where pass 2 then needs a large canvas)
        if (spans.length === 0 && annots.length === 0 && drawnHits === 0) { try { page.cleanup(); } catch { /* still in use */ } continue; }
        // on a redacted page, an annotation whose content cannot be read (a stamp, an attached file…) is blacked out too
        const opaque = all.filter((an) => an.rect && UNREADABLE_ANNOTATIONS.has(an.subtype) && !annots.includes(an));
        const here = Math.max(new Set(spans.map((sp) => sp.m)).size, drawnHits) + annots.length;
        totalMatches += here;
        pagesHit.push(i + 1);
        perPage.push([i + 1, here]);
        found.set(i, { page, content, items, spans, boxes: [...annots, ...opaque], glyphs });
      }

      if (totalMatches === 0) {
        // no file is made: nothing would be removed (P33: the terms are named back, as the market's tools do)
        const asked = [terms.length ? quoteTerms(terms) : '', ...kinds.map((k) => PATTERNS[k].label.toLowerCase())].filter(Boolean).join(', ');
        setError(`No match found for ${asked} in this PDF's text (${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''} searched). Text that is part of a picture (a scan) cannot be found: run PDF OCR first.${unreadableNote()}`);
        setLoading(false);
        setProgress('');
        return;
      }
      const removed = sanitizeForCopy(srcDoc, [...found.keys()], lib);

      // Pass 2: the pages without a match are copied (from the made-safe source); each page with one is rebuilt from a
      // picture of itself with the matches blacked out.
      for (let i = 0; i < pdf.numPages; i++) {
        const where = `Page ${i + 1} of ${pdf.numPages}`;
        const hit = found.get(i);
        if (!hit) {
          const [copied] = await outDoc.copyPages(srcDoc, [i]);
          outDoc.addPage(copied);
          continue;
        }
        const { page, content, items, spans, boxes, glyphs } = hit;
        setProgress(`${where}: blacking out ${perPage.find(([pg]) => pg === i + 1)[1]} occurrence(s)...`);

        // A black rectangle drawn on top of the page still leaves the
        // original text operators in the content stream, so the "hidden"
        // text stays selectable/extractable underneath. pdf-lib and
        // @cantoo/pdf-lib both only expose page/content-stream *construction*
        // APIs, not a supported way to excise specific text runs from an
        // existing content stream. So instead: rasterize this page to a
        // bitmap, black out the matched regions in the pixels themselves,
        // and rebuild the page from that image with no vector content
        // underneath at all. P35 (05/10, decision D3): the words outside the
        // black boxes are then written back over the picture as invisible
        // text, from the text read in pass 1 (never the blacked-out ones).
        const rotation = page.rotate;
        const unit = page.getViewport({ scale: 1, rotation: 0 });
        const viewport = page.getViewport({ scale: fitScale(unit.width, unit.height, scale), rotation: 0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        // P32: on iPhone / iPad, a page the device has not drawn within LOCAL_PAGE_LIMIT_MS is drawn by our PDF service
        // (same density, PNG, lossless) and the redaction boxes are painted on it here, exactly as on a local drawing.
        let drawn = false;
        if (!remote) {
          try {
            const task = page.render({ canvasContext: ctx, viewport });
            await (canFallBack ? withTimeout(task.promise, LOCAL_PAGE_LIMIT_MS(), 'timeout', () => task.cancel()) : step(task.promise, `${where}: drawing the page`, () => task.cancel()));
            drawn = true;
          } catch (e) {
            if (!canFallBack) throw e;
            console.warn(`[pdf-redact] page ${i + 1} not drawn on this device (${e?.name}: ${e?.message}); our PDF service draws it`);
            remote = true;
          }
        }
        if (!drawn) {
          if (!renderer) renderer = new ServerPageRenderer(file);
          sentToServer = true;
          setProgress(`${where}: drawing it on our PDF service...`);
          let r;
          try {
            r = await renderer.render({ page: i + 1, dpi: Math.max(36, Math.round(72 * viewport.scale)), format: 'png', maxPixels: Math.max(100000, Math.ceil(canvas.width * canvas.height * 1.05)) });
          } catch (e2) {
            throw new Error(`page ${i + 1} could not be drawn on this device, and our PDF service could not draw it either: ${e2.message}`);
          }
          const img = await createImageBitmap(r.blob);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          drawUnrotated(ctx, img, canvas.width, canvas.height, ((rotation % 360) + 360) % 360);
          if (img.close) img.close();
          drawnByServer.push(i + 1);
        }

        ctx.fillStyle = '#000000';
        const poly = (pts) => { ctx.beginPath(); pts.forEach(([x, y], n) => { const [vx, vy] = viewport.convertToViewportPoint(x, y); if (n) ctx.lineTo(vx, vy); else ctx.moveTo(vx, vy); }); ctx.closePath(); ctx.fill(); };
        // Only the matched characters are covered (app/lib/pdfRedact.js, redactionQuads). P33 (review 05/10):
        // document.fonts.check() said "true" for a family that is not loaded at all (the specification's answer), so
        // the margin was never added; now the font counts as real only if a loaded FontFace has its name.
        const loadedFaces = new Set();
        if (document.fonts && document.fonts.forEach) document.fonts.forEach((f) => { if (f.status === 'loaded') loadedFaces.add(f.family.replace(/^["']|["']$/g, '')); });
        // P35: the fallback measure takes the font's weight and slant, and a non-embedded standard font its own widths
        const fontObj = (name) => { try { return page.commonObjs.has(name) ? page.commonObjs.get(name) : null; } catch { return null; } };
        const measureOf = (it, style) => {
          const real = loadedFaces.has(it.fontName);
          const f = fontObj(it.fontName);
          const std = standardWidthOf(f, lib);
          if (std && std(it.str) != null) return { real, width: (s) => std(s) ?? 0 };
          const font = `${f && f.italic ? 'italic ' : ''}${f && (f.bold || f.black) ? 'bold ' : ''}100px ${real ? `"${it.fontName}", ` : ''}${style.fontFamily || 'sans-serif'}`;
          return { real, width: (s) => { measure.font = font; return measure.measureText(s).width; } };
        };
        // P37: each glyph's ink, drawn with PDF.js's own font string on a small canvas and read from its pixels, and its
        // drawn advance (app/lib/pdfRedact.js canvasInk, glyphRects). Not known for a page our PDF service drew (its
        // glyphs come from Poppler's fonts): that glyph is padded by 15 % of the font size as before, or its whole line
        // covered when PDF.js re-measures that font.
        if (!inkCanvas) { inkCanvas = document.createElement('canvas'); inkCanvas.width = 400; inkCanvas.height = 400; drawnInk = canvasInk(inkCanvas.getContext('2d', { willReadFrequently: true })); }
        const inkOf = (font, ch) => (drawn ? drawnInk(font, ch) : null);
        // P37: the black boxes fit the matched characters (their glyphs' advance and ink, plus one pixel or 2 % of the
        // font size); a run whose glyphs cannot be tied to its text keeps the padded estimate. The terms are also
        // searched in the glyphs drawn, and those glyphs covered. Without the glyphs (no answer in 20 s), the padded
        // estimate is used for every match, as before.
        let geo = null;
        try { geo = glyphs ? { glyphs, geometry: itemGeometry(items, content.styles, glyphs, inkOf) } : await withTimeout(pageGlyphGeometry(page, pdfjsLib, items, content.styles, inkOf), 20000, 'timeout'); } catch (e) { console.warn(`[pdf-redact] page ${i + 1}: glyph positions not read (${e?.message}); padded boxes used`); }
        const px = 1 / viewport.scale;
        const quads = [...redactionQuads(items, content.styles, spans, boxes.map((an) => an.rect), measureOf, geo && geo.geometry, px), ...(geo ? glyphTermQuads(geo.glyphs, terms, inkOf, px) : [])];
        // P37 seventh review (S1): a term still visible on this page outside the black boxes (missed by pass 1, while the
        // page is blacked out for another term) — the file is refused; checked before any invisible layer is taken off
        if (terms.length) {
          let srcGlyphs = geo && geo.glyphs;
          if (!srcGlyphs) { try { srcGlyphs = await step(pageGlyphs(page, pdfjsLib), `${where}: checking what stays visible`); } catch (e) { if (e instanceof StepTimeout) throw e; srcGlyphs = null; } }
          if (!srcGlyphs || visibleTermLeft(srcGlyphs, quads, terms)) stillVisible.push(i + 1);
        }
        for (const q of quads) poly(q);

        const blob = await step(new Promise((resolve) => canvas.toBlob(resolve, 'image/png')), `${where}: making the blacked-out image`);
        if (!blob) throw new Error(`${where}: this device could not make the blacked-out image.`);
        const imgBytes = await blob.arrayBuffer();
        const embeddedImg = await outDoc.embedPng(imgBytes);
        const { width: pw, height: ph } = page.getViewport({ scale: 1, rotation: 0 });
        const newPage = outDoc.addPage([pw, ph]);
        newPage.drawImage(embeddedImg, { x: 0, y: 0, width: pw, height: ph });
        // P35 (D3): the words outside the black boxes stay selectable, as invisible text over the picture (the page's
        // point (x, y) is where the scale-1, rotation-0 view puts it, the new page's y axis going up)
        if (!helvetica) helvetica = await outDoc.embedFont(lib.StandardFonts.Helvetica);
        const words = textLayerWords(items, content.styles, spans, quads, measureOf, spansOf, geo && geo.geometry);
        if (!arabicFont && !arabicFontProblem && words.some((w) => hasArabic(w.str))) {
          setProgress(`${where}: loading the Arabic font for its selectable text...`);
          try { arabicFont = await step(loadArabicFont(outDoc, lib), `${where}: loading the Arabic font`); } catch (e) { if (e instanceof StepTimeout) throw e; arabicFontProblem = e.message; }
        }
        const toPage = ([x, y]) => { const [vx, vy] = unit.convertToViewportPoint(x, y); return [vx, ph - vy]; };
        drawInvisibleWords(newPage, helvetica, words, toPage, lib, arabicFont);
        layered.set(i + 1, newPage);
        if (rotation) newPage.setRotation(degrees(rotation));
      }

      relinkDestinations(outDoc, lib);
      if (stillVisible.length) {
        setError(`This PDF could not be redacted safely: after blacking out, a term can still be read on ${stillVisible.length > 1 ? 'pages' : 'page'} ${listPages(stillVisible)} (written in a way the search could not place, for example a phrase split across two lines, or a Latin word inside Arabic text). No file is given. Redact ${stillVisible.length > 1 ? 'these pages' : 'this page'} in a desktop tool, or try a shorter term.${sentToServer ? ' Your PDF was sent to our own PDF service for this attempt, then deleted.' : ''}`);
        setLoading(false);
        setProgress('');
        return;
      }
      if (arabicFont) await step(arabicFont.finalize(), 'Saving the redacted PDF');
      setProgress('Saving the redacted PDF...');
      let pdfBytes = await step(outDoc.save(), 'Saving the redacted PDF');
      // P33: the finished file is read again; a file in which a term can still be found is not handed over
      setProgress('Checking the redacted PDF...');
      const verify = () => verifyRedacted(pdfBytes, { terms, textMatches, annotMatches: (t) => annotationMatches(t, terms, kinds), annotText: annotationText, pdfjsLib, lib, pageCount: pdf.numPages, glyphHit: terms.length ? async (pg) => { const g = await glyphsOf(pg); if (!g) throw new Error('the glyphs of a page could not be read'); return glyphTermMatches(g, terms).length > 0 || readingOrderHit(g, terms); } : null });
      let check = await step(verify(), 'Checking the redacted PDF');
      // P37 sixth review: a term read in the TEXT of a redacted page can only come from its invisible words (the page is
      // a picture): that page loses them and the file is checked again (once per page) — never a file with the term
      const layerless = [];
      while (!check.ok && check.where === 'text' && layered.has(check.page) && !layerless.includes(check.page) && removeInvisibleWords(layered.get(check.page), lib)) {
        layerless.push(check.page);
        pdfBytes = await step(outDoc.save(), 'Saving the redacted PDF');
        check = await step(verify(), 'Checking the redacted PDF');
      }
      if (!check.ok) {
        setError(`This PDF could not be redacted safely: after blacking out, ${check.reason}. No file is given. Please tell us about it through the contact page (without the file), or redact it in a desktop tool.${sentToServer ? ' Your PDF was sent to our own PDF service for this attempt, then deleted.' : ''}`);
        setLoading(false);
        setProgress('');
        return;
      }
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
      const byServer = drawnByServer.length ? ` This device could not draw ${drawnByServer.length > 1 ? 'pages' : 'page'} ${listPages(drawnByServer)}, so our own PDF service drew ${drawnByServer.length > 1 ? 'them' : 'it'} before the blacking out: your PDF was sent there, then deleted.` : '';
      const dropped = removed.annotations + removed.links ? ` On the other pages, ${[removed.annotations ? `${removed.annotations} stamp${removed.annotations > 1 ? 's' : ''} or attachment${removed.annotations > 1 ? 's' : ''} (content this tool cannot check)` : '', removed.links ? `${removed.links} link${removed.links > 1 ? 's' : ''} to a redacted page or running a script` : ''].filter(Boolean).join(' and ')} ${removed.annotations + removed.links > 1 ? 'were' : 'was'} removed.` : '';
      const detail = perPage.map(([pg, n]) => `page ${pg}: ${n}`).join(', ');
      setSummary(`Blacked out ${totalMatches} occurrence${totalMatches > 1 ? 's' : ''} (${detail}). ${pagesHit.length > 1 ? 'These pages are' : 'This page is'} now a picture of the page with an invisible text layer holding the words outside the black boxes (so they can still be selected and searched; words touching a black box, vertical text, and words with letters our text fonts cannot write — Greek, Cyrillic, Hebrew, Asian scripts and some accented letters — are not kept), and the finished file was checked: the blacked-out text no longer exists in it.${arabicFontProblem ? ` Arabic words were not kept as selectable text: ${arabicFontProblem}.` : ''}${dropped} Check the result before sharing it: text drawn as an image (a scan) or inside a fill pattern cannot be found.${layerless.length ? ` ${layerless.length > 1 ? 'Pages' : 'Page'} ${listPages(layerless)} kept no selectable text: some of ${layerless.length > 1 ? 'their' : 'its'} words, read together, could spell a term.` : ''}${unreadableNote()}${byServer}`);
      } finally {
        if (renderer) renderer.close();
      }
    } catch(e) { setError((e instanceof StepTimeout ? e.message : 'Redaction failed: ' + e.message) + (sentToServer ? ' Your PDF was sent to our own PDF service for this attempt, then deleted.' : '')); }
    setProgress('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Redact PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Censor sensitive text in your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="a PDF file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Text to redact (one word or phrase per line)</label>
            <TextArea id="rd-terms" rows={3} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Enter text to censor..." className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <fieldset className="text-sm"><legend className="text-neutral-500 mb-1">Also find automatically</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(PATTERNS).map(([k, p]) => (
                <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={kinds.includes(k)} onChange={e => setKinds(e.target.checked ? [...kinds, k] : kinds.filter((x) => x !== k))} /> {p.label}</label>
              ))}
            </div>
          </fieldset>
          <button onClick={redact} disabled={!file || (!keyword.trim() && !kinds.length) || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Redacting...' : 'Redact PDF'}
          </button>
          {loading && progress && <p className="text-xs text-neutral-600 text-center" aria-live="polite" data-redact-progress>{progress}</p>}
          {onAppleTouch && <p className="text-xs text-neutral-600 text-center" data-server-render-note>On iPhone and iPad, a page your device cannot draw within {LOCAL_PAGE_LIMIT_LABEL} is drawn by our own PDF service instead: your PDF is sent there, then deleted.</p>}
          <div ref={resultRef} className="space-y-4 scroll-mt-24">
            {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
            {summary && <p className="text-neutral-700 text-center text-sm" data-summary>{summary}</p>}
            {result && <FileDownload href={result} name="redacted.pdf" />}
          </div>
        </div>
      </div>
      <SeoContent
        title="PDF Redact"
        description={`PDF Redact finds the words or phrases you list, one per line, and if you tick them every e-mail address, phone number and card number, in the text of your PDF and in its form fields and comments. The search ignores case, spaces, line breaks, accents and hyphens. Each page with a match is rebuilt as a picture with the matches blacked out in the pixels, plus an invisible text layer for the other words, so the hidden text is gone from the file. Each black box is fitted to the glyphs of the matched letters, so the words beside them stay readable. The finished PDF is searched again and withheld if a term can still be found. Scanned pages have no text to search: run PDF OCR first.`}
        howToTitle="How to redact text in a PDF"
        howTo={[
          `Choose the PDF; a file that needs a password to open is refused at once.`,
          `Type each word or phrase on its own line in "Text to redact (one word or phrase per line)", and tick "E-mail addresses", "Phone numbers" or "Card numbers" if needed.`,
          `Click "Redact PDF" and follow the page-by-page progress.`,
          `Read the summary of occurrences per page, then click "Download" to save redacted.pdf.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF with a text layer` },
          { label: 'Automatic patterns', value: `E-mail addresses; phone numbers of 9 to 15 digits; card numbers of 13 to 19 digits that pass the Luhn check` },
          { label: 'Pages with a match', value: `Replaced by a picture with black boxes and invisible text for the remaining words, Arabic included` },
          { label: 'Black boxes', value: `The matched letters' glyphs plus 2% of the font size or one pixel, whichever is larger, and half the outline width for outlined text; 15% of the font size on each side for invisible text over a scan (an OCR layer) or where a line's glyphs cannot be tied to its text, or the whole line` },
          { label: 'Pages without a match', value: `Copied, minus stamps, attachments, media and links to redacted pages, scripts or other files; the redacted file keeps no bookmarks, document properties or fillable form fields` },
          { label: 'On iPhone and iPad', value: `A matched page that fails or is not drawn within ${LOCAL_PAGE_LIMIT_LABEL} is drawn by our PDF service, for PDFs up to ${Math.floor(STAGED_MAX_BYTES / 1048576)} MB, up to 300 pages per hour and 1,000 pages per day per network` },
          { label: 'Result', value: `redacted.pdf` },
        ]}
        privacy={`On a computer or an Android device, searching, drawing and blacking out all happen in your browser, and the PDF is not uploaded. On an iPhone or iPad, a page with a match that the device fails to draw, or does not draw within ${LOCAL_PAGE_LIMIT_LABEL}, is drawn by our own PDF service (pdf-tools, not a third party): the PDF is sent there and then deleted, and the black boxes are still applied in your browser. The page tells you when this happens.`}
        faqs={[
          { q: "Is the text really removed, not just covered?", a: `Yes. A matched page is replaced by a picture of itself with the matches blacked out in the pixels, so no text sits under the boxes; only the other words come back as invisible text. The saved file is searched again, and if a term can still be found, no file is given.` },
          { q: "Will the rest of a redacted page stay searchable?", a: `Yes, mostly. Words outside the black boxes are written back as invisible, selectable text in reading order, Arabic words included, as the PDF's own text gives them. Not kept: words that touch a box, vertical text, and words in scripts the text layer cannot write, such as Greek, Cyrillic, Hebrew or Asian scripts; a page whose kept words could spell a term together keeps none. Links and form fields on that page are gone.` },
          { q: "Does it find a name written with or without accents?", a: `Yes. Accents, case, spaces, line breaks and hyphens are ignored, so Muller also finds Müller, and a word split across two lines is found too. This can black out slightly more than you typed, never less, so check the pages listed in the summary.` },
          { q: "Do pages without a match stay as they were?", a: `Yes, mostly: their text, images and ordinary links stay. Stamps, file attachments and media are removed because their content cannot be checked, with links that jump to a redacted page or run a script. The whole redacted file also loses its bookmarks, document properties and fillable form fields.` },
          { q: "Can it redact a scanned PDF?", a: `No. A scan has no text layer, so nothing can be found and the tool reports that there was no match. Run PDF OCR to get a searchable PDF, then redact that file.` },
          { q: "Can it miss a word that is in the PDF?", a: `Yes, when the PDF does not say which letters some of its characters are, which happens with some Arabic PDFs: that text cannot be searched. The summary, and the message saying no match was found, list the pages where part of the text cannot be read; check them, or run PDF OCR first. If a term could still be read in the finished file, no file is given.` },
        ]}
        tips={[
          `Prefer full phrases to short fragments: a short term can match inside other words and turn more pages into pictures than needed.`,
        ]}
      />
    </div>
  );
}