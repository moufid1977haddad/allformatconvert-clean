// Standard JavaScript that Safari 16.4-18.x / iOS 16.4-18.x lacks, added only when missing (P18, 01/10).
// Loaded before the site becomes interactive (instrumentation-client.js, the place Next.js documents for polyfills)
// and again by the PDF.js loader (app/lib/pdfjs.js); every function is idempotent.
//
// Floor of the site: Safari 16.4 / iOS 16.4 — Next.js's own browser floor (node_modules/next/dist/docs/03-architecture/
// supported-browsers.md). Our code and the libraries bundled with it are compiled for it (syntax: no ES2023+ in any
// shipped script, scripts/compat/check-syntax-es2022.mjs). Newer APIs found in the shipped code by
// scripts/compat/scan-modern-apis.mjs are either feature-detected where they are used, polyfilled inside their own
// library (PDF.js legacy build, page and worker), or added here. Everything is proven by the Safari 16.4 simulation
// of the benches (scripts/browser-tests/lib/safari16-sim.mjs), which removes these APIs in pages and Workers.
// Workers are separate globals: nothing here reaches them — each worker's code is audited on its own.

function define(obj, key, value) {
  if (obj && typeof obj[key] !== 'function') Object.defineProperty(obj, key, { value, writable: true, configurable: true });
}

export function installPolyfills() {
  if (typeof globalThis === 'undefined') return;

  // Promise.withResolvers (Safari 17.4), Promise.try (18.2)
  define(Promise, 'withResolvers', function withResolvers() {
    let resolve, reject;
    const promise = new this((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  });
  define(Promise, 'try', function tryFn(fn, ...args) {
    return new this((resolve) => resolve(fn(...args)));
  });

  // Object.groupBy / Map.groupBy (Safari 17.4)
  define(Object, 'groupBy', function groupBy(items, keyOf) {
    const out = Object.create(null);
    let i = 0;
    for (const item of items) { const k = keyOf(item, i++); (out[k] ||= []).push(item); }
    return out;
  });
  define(Map, 'groupBy', function groupBy(items, keyOf) {
    const out = new Map();
    let i = 0;
    for (const item of items) { const k = keyOf(item, i++); if (!out.has(k)) out.set(k, []); out.get(k).push(item); }
    return out;
  });

  // URL.canParse (Safari 17.0), URL.parse (18.0)
  if (typeof URL !== 'undefined') {
    define(URL, 'canParse', function canParse(url, base) { try { new URL(url, base); return true; } catch { return false; } });
    define(URL, 'parse', function parse(url, base) { try { return new URL(url, base); } catch { return null; } });
  }

  // Blob / Response .bytes() (Safari 18.0)
  const bytes = async function bytesFn() { return new Uint8Array(await this.arrayBuffer()); };
  if (typeof Blob !== 'undefined') define(Blob.prototype, 'bytes', bytes);
  if (typeof Response !== 'undefined') define(Response.prototype, 'bytes', bytes);

  // Async iteration of a ReadableStream (Safari 26.4): `for await (const chunk of stream)` — used by PDF.js's
  // getTextContent (every PDF text tool). WHATWG Streams: read until done, release the lock; leaving the loop early
  // cancels the stream unless preventCancel.
  if (typeof ReadableStream !== 'undefined' && typeof ReadableStream.prototype[Symbol.asyncIterator] !== 'function') {
    async function* values({ preventCancel = false } = {}) {
      const reader = this.getReader();
      let finished = false;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) { finished = true; return; }
          yield value;
        }
      } finally {
        if (!finished && !preventCancel) { try { await reader.cancel(); } catch { /* already errored */ } }
        reader.releaseLock();
      }
    }
    define(ReadableStream.prototype, 'values', values);
    define(ReadableStream.prototype, Symbol.asyncIterator, values);
  }
}
