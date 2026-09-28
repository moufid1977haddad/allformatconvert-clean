// EPUB / MOBI to PDF: one self-contained HTML file for the rendering server (audit 2, 29/09).
// The ebook parsers link every resource as a blob: URL, which only exists in this tab: the server rendering the PDF
// cannot fetch it. Only <img src> was inlined, so an SVG cover page (<svg><image xlink:href>, as calibre and Sigil
// write it) came out as a blank page and CSS images (url(...) in a stylesheet: backgrounds, ornaments, fonts) were
// lost. Now every blob: address is inlined as a data: URI -- <img src/srcset>, SVG <image href/xlink:href>, url()
// in stylesheets and style attributes -- and the separate cover page is not added when the book's first page
// already shows the cover (it came out twice).

async function blobToDataUri(url) {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const cached = async (cache, url) => {
  if (!cache.has(url)) cache.set(url, await blobToDataUri(url));
  return cache.get(url);
};

const CSS_BLOB_URL = /url\(\s*(['"]?)(blob:[^'")\s]+)\1\s*\)/g;
export async function inlineCssUrls(css, cache) {
  const urls = [...new Set([...css.matchAll(CSS_BLOB_URL)].map((m) => m[2]))];
  for (const u of urls) await cached(cache, u);
  return css.replace(CSS_BLOB_URL, (_, q, u) => `url("${cache.get(u)}")`);
}

const XLINK = 'http://www.w3.org/1999/xlink';

// bodyHtml: the chapter's HTML from the parser; cssHrefs: its stylesheets (blob: URLs).
export async function buildChapterHtml({ bodyHtml, cssHrefs, cache }) {
  const doc = new DOMParser().parseFromString(`<!DOCTYPE html><html><head></head><body>${bodyHtml}</body></html>`, 'text/html');
  for (const img of doc.body.querySelectorAll('img[src^="blob:"]')) img.setAttribute('src', await cached(cache, img.getAttribute('src')));
  for (const img of doc.body.querySelectorAll('img[srcset*="blob:"]')) img.removeAttribute('srcset');
  for (const im of doc.body.querySelectorAll('image')) {
    for (const [ns, attr] of [[null, 'href'], [XLINK, 'href']]) {
      const v = ns ? im.getAttributeNS(ns, attr) : im.getAttribute(attr);
      if (v && v.startsWith('blob:')) {
        const d = await cached(cache, v);
        if (ns) im.setAttributeNS(ns, 'xlink:href', d); else im.setAttribute(attr, d);
      }
    }
    // An xlink:href written without its namespace (parsed as a plain attribute).
    const plain = im.getAttribute('xlink:href');
    if (plain && plain.startsWith('blob:')) im.setAttribute('xlink:href', await cached(cache, plain));
  }
  for (const el of doc.body.querySelectorAll('[style*="blob:"]')) el.setAttribute('style', await inlineCssUrls(el.getAttribute('style'), cache));
  for (const st of doc.body.querySelectorAll('style')) if (st.textContent.includes('blob:')) st.textContent = await inlineCssUrls(st.textContent, cache);

  let styleBlock = '';
  for (const cssUrl of cssHrefs) {
    const key = 'css:' + cssUrl;
    if (!cache.has(key)) cache.set(key, await inlineCssUrls(await (await fetch(cssUrl)).text(), cache));
    styleBlock += `<style>${cache.get(key)}</style>`;
  }
  return styleBlock + doc.body.innerHTML;
}

// True when the book's first page already displays the cover image.
// Compared on the base64 data only: the two copies may carry different MIME types.
export const firstPageShowsCover = (firstChapterHtml, coverDataUri) => !!coverDataUri && !!firstChapterHtml && firstChapterHtml.includes(coverDataUri.slice(coverDataUri.indexOf(',') + 1));
