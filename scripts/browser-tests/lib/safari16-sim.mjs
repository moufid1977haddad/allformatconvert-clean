// Safari 16.4 / iOS 16.4 simulation (P18, 01/10): the JavaScript and DOM APIs those Safaris do not have are REMOVED
// before any script of the site runs — in the page (init script) AND in every Worker (each script served from
// /_next/static is rewritten to start by removing them too, since a Worker is a separate global that init scripts
// never reach). On 30/09 the real Safari 17.6 of the Mac stopped 9 PDF tools on "Promise.try is not a function": the
// WebKit of Playwright is recent and has Promise.try, so no bench could see it. With this simulation, the production
// build of that day fails the same way (red), the fixed build passes (green).
// Version where each API arrived in Safari: MDN / WebKit release notes (see scripts/compat/scan-modern-apis.mjs).

export const SAFARI16_REMOVE = String.raw`(() => {
  const g = globalThis;
  // Once per global: the page's own polyfills (app/lib/polyfills.js) must survive the scripts loaded after them.
  if (g.__safari16Sim) return;
  const del = (o, k) => { try { if (o && k in o) { Object.defineProperty(o, k, { value: undefined, configurable: true, writable: true }); delete o[k]; } } catch {} };
  del(Promise, 'try'); del(Promise, 'withResolvers');                                  // 18.2, 17.4
  del(Object, 'groupBy'); del(Map, 'groupBy');                                           // 17.4
  for (const k of ['union', 'intersection', 'difference', 'symmetricDifference', 'isSubsetOf', 'isSupersetOf', 'isDisjointFrom']) del(Set.prototype, k); // 17.0
  if (g.Iterator) { for (const k of ['map', 'filter', 'take', 'drop', 'flatMap', 'reduce', 'toArray', 'forEach', 'some', 'every', 'find']) del(g.Iterator.prototype, k); del(g.Iterator, 'from'); del(g, 'Iterator'); } // 18.4
  del(RegExp, 'escape'); del(g, 'Float16Array'); del(Math, 'f16round'); del(Math, 'sumPrecise'); // 18.2, 18.2, 26
  del(Uint8Array, 'fromBase64'); del(Uint8Array, 'fromHex');                             // 18.2
  for (const k of ['toBase64', 'toHex', 'setFromBase64', 'setFromHex']) del(Uint8Array.prototype, k);
  if (g.URL) { del(URL, 'parse'); del(URL, 'canParse'); }                                // 18.0, 17.0
  del(ArrayBuffer.prototype, 'transfer'); del(ArrayBuffer.prototype, 'transferToFixedLength'); // 17.4
  if (g.AbortSignal) del(AbortSignal, 'any');                                            // 17.4
  if (g.ReadableStream) { del(ReadableStream, 'from'); del(ReadableStream.prototype, Symbol.asyncIterator); del(ReadableStream.prototype, 'values'); }
  if (g.Blob) del(Blob.prototype, 'bytes'); if (g.Response) del(Response.prototype, 'bytes'); if (g.Request) del(Request.prototype, 'bytes'); // 18.0
  del(Error, 'isError');
  for (const k of ['requestIdleCallback', 'cancelIdleCallback', 'showSaveFilePicker', 'showOpenFilePicker', 'showDirectoryPicker', 'ImageDecoder', 'AudioEncoder', 'AudioDecoder', 'EyeDropper', 'scheduler']) del(g, k);
  if (g.Element) del(Element.prototype, 'checkVisibility');                               // 17.4
  if (g.Document) del(Document.prototype, 'startViewTransition');                         // 18.0
  if (g.FileSystemFileHandle) del(FileSystemFileHandle.prototype, 'createWritable');      // 26
  g.__safari16Sim = true;
})();
`;

/** Applies the simulation to every page of the context and every script (hence every Worker) of the site. */
// `rewritten` lists the scripts that went through the rewrite: a bench checks the PDF.js worker is among them (proof
// the Worker ran under the simulation, not only the page).
export async function applySafari16Sim(ctx) {
  const rewritten = [];
  await ctx.addInitScript(SAFARI16_REMOVE);
  await ctx.route(/\/_next\/static\/.*\.m?js(\?|$)/, async (route) => {
    try {
      const r = await route.fetch();
      const body = await r.text();
      const headers = { ...r.headers() };
      delete headers['content-length']; delete headers['content-encoding'];
      rewritten.push(route.request().url());
      await route.fulfill({ status: r.status(), headers, body: SAFARI16_REMOVE + '\n' + body });
    } catch {
      // the page that asked for the script was closed meanwhile (end of a test): nothing left to serve
      await route.abort().catch(() => {});
    }
  });
  return rewritten;
}
