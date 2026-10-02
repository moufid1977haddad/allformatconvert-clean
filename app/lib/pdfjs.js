// The one way the site loads PDF.js.
//
// The "modern" build of pdfjs-dist 5 calls Promise.try (Safari 18.2+), Promise.withResolvers (17.4+), Set methods,
// iterator helpers, Uint8Array base64… without polyfills: on Safari 17.6 the page stayed on "Converting…" /
// "Reading PDF…" with "Promise.try is not a function" (9 PDF tools, Mac pass of 30/09). The "legacy" build is the one
// Mozilla ships for older browsers: Babel-transpiled, with core-js polyfills bundled INSIDE both the library and its
// worker — the worker runs in its own global, so a polyfill loaded by the page would not reach it.
//
// One gap the legacy build leaves: page.getTextContent() reads a ReadableStream with `for await`, and Safari has no
// async iteration of ReadableStream before 26.4 (core-js does not cover streams). Found by the Safari 16.4 simulation
// (scripts/browser-tests/safari16-pdf.mjs): every text tool — Extract Text, Compare, Redact, PDF to HTML, OCR, the AI
// summary and translation — would still have failed on Safari 17 and 18 with the legacy build alone. The standard
// behaviour is added when missing (app/lib/polyfills.js, WHATWG Streams "ReadableStream async iterator"). It is only needed in the page: the worker's
// one `for await` over a stream (DecompressionStream) is inside a try/catch with a fallback.
// Kept guarded by scripts/compat (build scan) and the Safari 16.4 simulation in scripts/browser-tests/lib.

import { installPolyfills } from './polyfills';

// P24 (03/10): where PDF.js finds its run-time files (copied to public/ by scripts/copy-pdfjs-assets.mjs). Without
// wasmUrl, a JPEG 2000, JBIG2 or CCITT fax picture — the formats of scanned documents — was skipped with a console
// warning and the page rendered WHITE (PDF to JPG, Redact, OCR…; measured: scripts/p24/pdfjs-decoders.mjs). Without
// cMapUrl, the text of a Chinese, Japanese or Korean PDF whose fonts are not embedded came out empty or wrong.
// Every getDocument of the site goes through here, so they are given once, for all tools.
function withAssets(pdfjsLib) {
  const base = `/pdfjs/${pdfjsLib.version}/`;
  const assets = { wasmUrl: base + 'wasm/', cMapUrl: base + 'cmaps/', cMapPacked: true, iccUrl: base + 'iccs/', standardFontDataUrl: base + 'standard_fonts/' };
  const getDocument = (src) => {
    const params = src instanceof Uint8Array || src instanceof ArrayBuffer ? { data: src } : typeof src === 'string' || src instanceof URL ? { url: src } : { ...src };
    return pdfjsLib.getDocument({ ...assets, ...params });
  };
  // a plain copy of the exports (a bundled module's exports are read-only: a Proxy may not return another getDocument)
  return { ...pdfjsLib, getDocument };
}

export async function loadPdfjs() {
  installPolyfills(); // also run by instrumentation-client.js; idempotent
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();
  return withAssets(pdfjsLib);
}
