// P37 (06/10) — recreates the 31 trap PDFs of the P33 independent reviews of PDF Redact (lost with %TEMP% on 06/10) and
// r6/smask-none.pdf (P37 sixth review), from their descriptions: docs/audit/RAPPORT-p33-redact-ocr-05-10.md §2c, §2e, §7,
// and the comments of app/lib/redactSanitize.js. Each file holds the term of scripts/p35/traps.txt and the attack its
// name says; unless said otherwise, page 2 holds the term in its text (the page that gets redacted) and page 1 carries
// the trap (what a copy of page 1 must not bring back). Written to a durable, git-ignored folder:
//   node scripts/p37/make-p33-traps.mjs [out dir, default scripts/audit/results/redact-traps]
// Then: node scripts/p37/redact-traps-node.mjs --list=scripts/p35/traps.txt --root=scripts/audit/results/redact-traps --ocr
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, PDFName, PDFString, PDFArray, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'scripts/audit/results/redact-traps'));
const NOTO = fs.readFileSync(path.join(ROOT, 'public/fonts/noto/NotoSans-Regular.ttf'));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const TERM = 'ZORGLUB-77';
const N = (s) => PDFName.of(s);
const S = (s) => PDFString.of(s);
const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`);

async function doc() {
  const d = await PDFDocument.create();
  d.registerFontkit(fontkit);
  const helv = await d.embedFont(StandardFonts.Helvetica);
  const ctx = d.context;
  const page = (content, res = null, size = [595, 842]) => {
    const p = d.addPage(size);
    p.node.set(N('Resources'), res || ctx.obj({ Font: { F1: helv.ref } }));
    p.node.set(N('Contents'), ctx.register(ctx.stream(content)));
    return p;
  };
  const txt = (s, y = 760, size = 14, x = 50) => `BT /F1 ${size} Tf ${x} ${y} Td (${esc(s)}) Tj ET`;
  const form = (content, bbox = [0, 0, 240, 24], res = null) => ctx.register(ctx.stream(content, { Type: 'XObject', Subtype: 'Form', BBox: bbox, Resources: res || ctx.obj({ Font: { F1: helv.ref } }) }));
  const annot = (p, dict) => {
    const ref = ctx.register(ctx.obj({ Type: 'Annot', ...dict }));
    const arr = p.node.lookupMaybe(N('Annots'), PDFArray);
    if (arr) arr.push(ref); else p.node.set(N('Annots'), ctx.obj([ref]));
    return ref;
  };
  const termPage = (extra = '') => page(`${txt(`Client reference ${TERM} is closed.`)}\n${txt('This line stays readable.', 720, 12)}${extra ? `\n${extra}` : ''}`);
  return { d, ctx, helv, page, txt, form, annot, termPage };
}
const save = async (d, name) => { const f = path.join(OUT, name); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, await d.save()); console.log('written', path.relative(ROOT, f)); };

// ---- round 1 (f1-f12) ----
{ // f1: page 1 (no term) holds a table-of-contents link whose /Dest is page 2 — copyPages(page 1) brought page 2 back
  const { d, ctx, page, txt, annot, termPage } = await doc();
  const p1 = page(`${txt('Contents')}\n${txt('1. Client file .......... page 2', 730, 12)}`);
  const p2 = termPage();
  annot(p1, { Subtype: 'Link', Rect: [50, 726, 300, 742], Border: [0, 0, 0], Dest: [p2.ref, 'XYZ', 0, 842, 0] });
  void ctx; await save(d, 'f1-link-dest.pdf');
}
{ // f2: both pages share one /Resources holding a form that draws the term; only page 2 draws it
  const { d, ctx, helv, page, txt, form } = await doc();
  const x1 = form(`BT /F1 12 Tf 0 6 Td (${TERM}) Tj ET`);
  const shared = ctx.register(ctx.obj({ Font: { F1: helv.ref }, XObject: { X1: x1 } }));
  page(txt('Page one, shared resources.'), shared);
  page(`${txt('Page two:')}\nq 1 0 0 1 120 756 cm /X1 Do Q`, shared);
  await save(d, 'f2-shared-resources.pdf');
}
{ // f3: a form field whose /Parent has /Kids on both pages; the page-2 kid's value is the term
  const { d, ctx, page, txt } = await doc();
  const p1 = page(txt('Form page one'));
  const p2 = page(txt('Form page two'));
  const parent = ctx.nextRef();
  const a = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Tx', T: S('a'), V: S('hello'), Rect: [50, 700, 250, 724], P: p1.ref, Parent: parent }));
  const b = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Tx', T: S('b'), V: S(TERM), Rect: [50, 700, 250, 724], P: p2.ref, Parent: parent }));
  ctx.assign(parent, ctx.obj({ T: S('client'), Kids: [a, b] }));
  p1.node.set(N('Annots'), ctx.obj([a]));
  p2.node.set(N('Annots'), ctx.obj([b]));
  d.catalog.set(N('AcroForm'), ctx.obj({ Fields: [parent], NeedAppearances: true }));
  await save(d, 'f3-field-kids.pdf');
}
const W = (helv, s, size) => helv.widthOfTextAtSize(s, size);
{ // f4: "Müller" with the diaeresis drawn as its own glyph moved back over the u (TJ offsets)
  const { d, helv, page, txt } = await doc();
  const u = W(helv, 'u', 1000), dia = W(helv, '¨', 1000);
  page(`BT /F1 18 Tf 50 760 Td [(Client: Mu) ${u.toFixed(0)} (\\250) ${(-(u - dia)).toFixed(0)} (ller)] TJ ET\n${txt('Also: Jane', 720, 18)}`);
  await save(d, 'f4-accent-overlay.pdf');
}
{ // f4b: "Mu" + COMBINING DIAERESIS U+0308 + "ller" (Type 0 font), the mark drawn back over the u
  const { d, page, ctx } = await doc();
  const noto = await d.embedFont(NOTO, { subset: false });
  const res = ctx.obj({ Font: { F2: noto.ref } });
  const back = (noto.widthOfTextAtSize('u', 1000) * 0.8).toFixed(0);
  page(`BT /F2 18 Tf 50 760 Td [${noto.encodeText('Client: Mu').toString()} ${back} ${noto.encodeText('̈').toString()} -${back} ${noto.encodeText('ller').toString()}] TJ ET`, res);
  await save(d, 'f4b-accent-combining.pdf');
}
{ // f4c: "Müller" on two pages: drawn with a separate accent on page 1, as one WinAnsi letter on page 2
  const { d, helv, page } = await doc();
  const u = W(helv, 'u', 1000), dia = W(helv, '¨', 1000);
  page(`BT /F1 18 Tf 50 760 Td [(Client: Mu) ${u.toFixed(0)} (\\250) ${(-(u - dia)).toFixed(0)} (ller)] TJ ET`);
  page('BT /F1 18 Tf 50 760 Td (Contact: M\\374ller, Berlin) Tj ET');
  await save(d, 'f4c-accent-two-pages.pdf');
}
{ // f4d: TeX-style: the diaeresis drawn FIRST, above the u, then the letters, in separate text objects (two pages)
  const { d, helv, page } = await doc();
  const x0 = 50 + W(helv, 'Client: M', 18);
  const one = `BT /F1 18 Tf 50 760 Td (Client: M) Tj ET\nBT /F1 18 Tf ${(x0 + 1).toFixed(2)} 764 Td (\\250) Tj ET\nBT /F1 18 Tf ${x0.toFixed(2)} 760 Td (uller, Berlin) Tj ET`;
  page(one);
  page(one.replace('Client: M', 'Contact: M').replace(x0.toFixed(2), (50 + W(helv, 'Contact: M', 18)).toFixed(2)).replace((x0 + 1).toFixed(2), (50 + W(helv, 'Contact: M', 18) + 1).toFixed(2)));
  await save(d, 'f4d-tex-accent.pdf');
}
{ // f5: large character spacing (Tc) on the whole line: the edge of "SECRET" stayed visible
  const { d, page, txt } = await doc();
  page(`BT /F1 14 Tf 4 Tc 60 760 Td (iiiiiiiiiii SECRET WWWWWWWWWWWW) Tj ET\n${txt('control line', 700)}`);
  await save(d, 'f5-charspacing.pdf');
}
{ // f5b: kerning offsets (TJ) inside and around "SECRET"
  const { d, page, txt } = await doc();
  page(`BT /F1 14 Tf 60 760 Td [(iiiiiiiiiiiiii ) -300 (S) -200 (E) -150 (C) 120 (R) -90 (E) 60 (T) 200 (WWWWWWWWWWWWW)] TJ ET\n${txt('control line', 700)}`);
  await save(d, 'f5b-kerning.pdf');
}
{ // f5c: large word spacing (Tw)
  const { d, page, txt } = await doc();
  page(`BT /F1 14 Tf 18 Tw 60 760 Td (alpha beta SECRET gamma delta epsilon zeta eta theta) Tj ET\n${txt('control line', 700)}`);
  await save(d, 'f5c-wordspacing.pdf');
}
{ // f6: a stamp on page 1 whose appearance draws the term (no /Contents: nothing to search)
  const { d, page, txt, form, annot, termPage } = await doc();
  const p1 = page(txt('Approved page'));
  termPage();
  annot(p1, { Subtype: 'Stamp', Rect: [300, 600, 540, 624], Name: 'Approved', AP: { N: form(`BT /F1 16 Tf 2 6 Td (${TERM}) Tj ET`) } });
  await save(d, 'f6-stamp-appearance.pdf');
}
{ // f7: a file attachment on page 1 named after the term, its file holding it
  const { d, ctx, page, txt, annot, termPage } = await doc();
  const p1 = page(txt('Attachment page'));
  termPage();
  const file = ctx.register(ctx.stream(`Client ${TERM} details`, { Type: 'EmbeddedFile' }));
  annot(p1, { Subtype: 'FileAttachment', Rect: [50, 700, 70, 720], Contents: S('attached file'), FS: { Type: 'Filespec', F: S(`${TERM}.txt`), UF: S(`${TERM}.txt`), EF: { F: file } } });
  await save(d, 'f7-file-attachment.pdf');
}
{ // f8: a comment on page 1 whose rich text (/RC) and subject (/Subj) hold the term
  const { d, page, txt, annot, termPage } = await doc();
  const p1 = page(txt('Comment page'));
  termPage();
  annot(p1, { Subtype: 'Text', Rect: [50, 700, 70, 720], Contents: S('see note'), Subj: S(`About ${TERM}`), RC: S(`<?xml version="1.0"?><body xmlns="http://www.w3.org/1999/xhtml"><p>Call ${TERM}</p></body>`), Open: false });
  await save(d, 'f8-richtext-subject.pdf');
}
{ // f9: a link on page 1 running JavaScript that holds the term
  const { d, page, txt, annot, termPage } = await doc();
  const p1 = page(txt('Click here'));
  termPage();
  annot(p1, { Subtype: 'Link', Rect: [50, 756, 140, 774], Border: [0, 0, 0], A: { S: 'JavaScript', JS: S(`app.alert('${TERM}');`) } });
  await save(d, 'f9-js-link.pdf');
}
{ // f10: the term in a HIDDEN optional-content layer on page 1, and visible on page 2
  const { d, ctx, helv, page, txt, termPage } = await doc();
  const ocg = ctx.register(ctx.obj({ Type: 'OCG', Name: S('Hidden notes') }));
  d.catalog.set(N('OCProperties'), ctx.obj({ OCGs: [ocg], D: { Order: [ocg], OFF: [ocg] } }));
  page(`${txt('Layer page')}\n/OC /oc1 BDC ${txt(`Hidden: ${TERM}`, 720)} EMC`, ctx.obj({ Font: { F1: helv.ref }, Properties: { oc1: ocg } }));
  termPage();
  await save(d, 'f10-hidden-layer.pdf');
}
{ // f11: page 1's /PieceInfo (an application's private data) holds the term
  const { d, page, txt, termPage, ctx } = await doc();
  const p1 = page(txt('PieceInfo page'));
  p1.node.set(N('PieceInfo'), ctx.obj({ MyApp: { LastModified: S('D:20261005000000Z'), Private: { Note: S(`client ${TERM}`) } } }));
  termPage();
  await save(d, 'f11-pieceinfo.pdf');
}
{ // f12: "ZORG-" + zero-width space + "LUB-77" (Type 0 font): hyphen and invisible break inside the term
  const { d, page, ctx } = await doc();
  const noto = await d.embedFont(NOTO, { subset: false });
  page(`BT /F2 14 Tf 50 760 Td ${noto.encodeText('Client: ZORG-​LUB-77 here').toString()} Tj ET`, ctx.obj({ Font: { F2: noto.ref } }));
  await save(d, 'f12-zwsp-hyphen.pdf');
}
{ // f12b: the term hyphenated at a line end ("ZORG-" / "LUB-77"), on page 1 and (differently cut) on page 2
  const { d, page, txt } = await doc();
  page(`${txt('Hyphen case: ZORG-', 760, 12)}\n${txt('LUB-77 next line', 744, 12)}`);
  page(`${txt('Second case ZORGLUB-', 760, 12)}\n${txt('77', 744, 12)}`);
  await save(d, 'f12b-hyphen.pdf');
}

// ---- round 2 (g1-g6) ----
{ // g1: a text field on page 1 whose value is harmless but whose appearance (/AP) draws the term
  const { d, ctx, page, txt, form, termPage } = await doc();
  const p1 = page(txt('Field page'));
  termPage();
  const w = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Tx', T: S('client'), V: S('hello'), Rect: [50, 700, 290, 724], P: p1.ref, AP: { N: form(`/Tx BMC BT /F1 12 Tf 2 6 Td (${TERM}) Tj ET EMC`) } }));
  p1.node.set(N('Annots'), ctx.obj([w]));
  d.catalog.set(N('AcroForm'), ctx.obj({ Fields: [w] }));
  await save(d, 'r2/g1-widget-ap-differs.pdf');
}
{ // g1b: a square annotation on page 1 whose appearance draws the term
  const { d, page, txt, form, annot, termPage } = await doc();
  const p1 = page(txt('Shapes page'));
  termPage();
  annot(p1, { Subtype: 'Square', Rect: [50, 600, 290, 640], C: [1, 0, 0], AP: { N: form(`1 0 0 RG 1 1 238 38 re S BT /F1 12 Tf 6 14 Td (${TERM}) Tj ET`, [0, 0, 240, 40]) } });
  await save(d, 'r2/g1b-square-ap.pdf');
}
{ // g2: an ExtGState with a soft mask whose group draws the term, INHERITED from /Pages by both pages; page 2 uses it
  const { d, ctx, helv, txt } = await doc();
  const g = ctx.register(ctx.stream(`BT /F1 12 Tf 0 6 Td (${TERM}) Tj ET`, { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 240, 24], Group: { S: 'Transparency', CS: 'DeviceGray' }, Resources: { Font: { F1: helv.ref } } }));
  const gs = ctx.register(ctx.obj({ Type: 'ExtGState', SMask: { Type: 'Mask', S: 'Luminosity', G: g } }));
  d.catalog.Pages().set(N('Resources'), ctx.obj({ Font: { F1: helv.ref }, ExtGState: { GS1: gs } }));
  for (const content of [txt('Page one, inherited resources.'), `${txt(`Client reference ${TERM} is closed.`)}\nq /GS1 gs 0 0 1 rg 50 600 200 40 re f Q`]) {
    const p = d.addPage([595, 842]);
    p.node.delete(N('Resources'));
    p.node.set(N('Contents'), ctx.register(ctx.stream(content)));
  }
  await save(d, 'r2/g2-extgstate-smask-inherited.pdf');
}
{ // g2b: the same soft-mask ExtGState in ONE /Resources dictionary shared by both pages
  const { d, ctx, helv, page, txt } = await doc();
  const g = ctx.register(ctx.stream(`BT /F1 12 Tf 0 6 Td (${TERM}) Tj ET`, { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 240, 24], Group: { S: 'Transparency', CS: 'DeviceGray' }, Resources: { Font: { F1: helv.ref } } }));
  const gs = ctx.register(ctx.obj({ Type: 'ExtGState', SMask: { Type: 'Mask', S: 'Luminosity', G: g } }));
  const shared = ctx.register(ctx.obj({ Font: { F1: helv.ref }, ExtGState: { GS1: gs } }));
  page(txt('Page one, shared resources.'), shared);
  page(`${txt(`Client reference ${TERM} is closed.`)}\nq /GS1 gs 0 0 1 rg 50 600 200 40 re f Q`, shared);
  await save(d, 'r2/g2b-extgstate-smask-shared.pdf');
}
{ // g3: a /Properties entry (marked content with /ActualText = the term), in resources shared by both pages
  const { d, ctx, helv, page, txt } = await doc();
  const shared = ctx.register(ctx.obj({ Font: { F1: helv.ref }, Properties: { MC0: { ActualText: S(TERM) } } }));
  page(txt('Page one, shared properties.'), shared);
  page(`${txt(`Client reference ${TERM} is closed.`)}\n/Span /MC0 BDC ${txt('XXXXX', 700)} EMC`, shared);
  await save(d, 'r2/g3-properties-actualtext.pdf');
}
{ // g4: page 1 draws an image named with an escape (/Im#31 for "Im1") — pruning must keep it
  const { d, ctx, helv, page, txt, termPage } = await doc();
  const img = await d.embedPng(PNG);
  page(`${txt('Logo page')}\nq 60 0 0 60 50 640 cm /Im#31 Do Q`, ctx.obj({ Font: { F1: helv.ref }, XObject: { Im1: img.ref } }));
  termPage();
  await save(d, 'r2/g4-name-escape.pdf');
}
{ // g5: the term "Adobe" in the text; every embedded Type 0 font carries /Registry (Adobe) (a false refusal before)
  const { d, page, ctx } = await doc();
  const noto = await d.embedFont(NOTO, { subset: true });
  const res = ctx.obj({ Font: { F2: noto.ref } });
  page(`BT /F2 14 Tf 50 760 Td ${noto.encodeText('Our report, page one.').toString()} Tj ET`, res);
  page(`BT /F2 14 Tf 50 760 Td ${noto.encodeText('Supplier: Adobe Inc.').toString()} Tj ET`, res);
  await save(d, 'r2/g5-false-positive-adobe.pdf');
}
{ // g6: a text field on page 1 whose DEFAULT value (/DV) is the term (its value is harmless)
  const { d, ctx, page, txt, termPage } = await doc();
  const p1 = page(txt('Field page'));
  termPage();
  const w = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Tx', T: S('client'), V: S('hello'), DV: S(TERM), Rect: [50, 700, 290, 724], P: p1.ref }));
  p1.node.set(N('Annots'), ctx.obj([w]));
  d.catalog.set(N('AcroForm'), ctx.obj({ Fields: [w], NeedAppearances: true }));
  await save(d, 'r2/g6-default-value.pdf');
}

// ---- round 3 (h1-h5) ----
{ // h1: a table of contents on page 1 linking to page 2 (KEPT); the term is on page 3 (a false refusal before)
  const { d, page, txt, annot } = await doc();
  const p1 = page(`${txt('Contents')}\n${txt('1. Introduction .......... page 2', 730, 12)}`);
  const p2 = page(txt('Introduction'));
  page(txt(`Client reference ${TERM} is closed.`));
  annot(p1, { Subtype: 'Link', Rect: [50, 726, 300, 742], Border: [0, 0, 0], Dest: [p2.ref, 'XYZ', 0, 842, 0] });
  await save(d, 'r3/h1-toc-link-to-kept-page.pdf');
}
{ // h2: a check box on page 1, now off, whose "on" appearance draws the term
  const { d, ctx, page, txt, form, termPage } = await doc();
  const p1 = page(txt('Check box page'));
  termPage();
  const w = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Btn', T: S('agree'), V: 'Off', AS: 'Off', Rect: [50, 700, 290, 724], P: p1.ref, AP: { N: { On: form(`BT /F1 12 Tf 2 6 Td (${TERM}) Tj ET`), Off: form('') } } }));
  p1.node.set(N('Annots'), ctx.obj([w]));
  d.catalog.set(N('AcroForm'), ctx.obj({ Fields: [w] }));
  await save(d, 'r3/h2-checkbox-other-state.pdf');
}
{ // h3: a push button on page 1 whose "pressed" (/D) appearance draws the term
  const { d, ctx, page, txt, form, termPage } = await doc();
  const p1 = page(txt('Button page'));
  termPage();
  const w = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Btn', Ff: 65536, T: S('send'), Rect: [50, 700, 290, 724], P: p1.ref, AP: { N: form('BT /F1 12 Tf 2 6 Td (Send) Tj ET'), D: form(`BT /F1 12 Tf 2 6 Td (${TERM}) Tj ET`) } }));
  p1.node.set(N('Annots'), ctx.obj([w]));
  d.catalog.set(N('AcroForm'), ctx.obj({ Fields: [w] }));
  await save(d, 'r3/h3-button-down-appearance.pdf');
}
{ // h4: a web link on page 1 whose appearance draws the term
  const { d, page, txt, form, annot, termPage } = await doc();
  const p1 = page(txt('Links page'));
  termPage();
  annot(p1, { Subtype: 'Link', Rect: [50, 700, 290, 724], Border: [0, 0, 0], A: { S: 'URI', URI: S('https://example.com/') }, AP: { N: form(`BT /F1 12 Tf 2 6 Td (${TERM}) Tj ET`) } });
  await save(d, 'r3/h4-link-appearance.pdf');
}
{ // h5: a tiling pattern whose cell draws the term, in resources shared by both pages; page 2 fills with it. The cell's text is
  // WHITE: text drawn in a fill pattern is never searched (a limit the page states), so a visible one would stay on the
  // picture; the trap is about the pattern coming back through the copy of page 1 (resource pruning)
  const { d, ctx, helv, page, txt } = await doc();
  const pat = ctx.register(ctx.stream(`1 g BT /F1 8 Tf 2 4 Td (${TERM}) Tj ET`, { Type: 'Pattern', PatternType: 1, PaintType: 1, TilingType: 1, BBox: [0, 0, 80, 16], XStep: 80, YStep: 16, Resources: { Font: { F1: helv.ref } } }));
  const shared = ctx.register(ctx.obj({ Font: { F1: helv.ref }, Pattern: { P1: pat } }));
  page(txt('Page one, shared pattern.'), shared);
  page(`${txt(`Client reference ${TERM} is closed.`)}\nq /Pattern cs /P1 scn 50 600 240 48 re f Q`, shared);
  await save(d, 'r3/h5-tiling-pattern.pdf');
}

// ---- P37 sixth review: /SMask /None ----
{
  const { d, ctx, helv, page, txt } = await doc();
  page(txt(`Client reference ${TERM} is closed.`));
  const gs = ctx.register(ctx.obj({ Type: 'ExtGState', SMask: 'None', ca: 1, CA: 1 }));
  page(`q /GS1 gs ${txt('A page with a soft mask set to None.')} Q`, ctx.obj({ Font: { F1: helv.ref }, ExtGState: { GS1: gs } }));
  await save(d, 'r6/smask-none.pdf');
}
console.log(`done: ${OUT}`);
