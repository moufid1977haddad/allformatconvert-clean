// Which tool pages send the visitor's file or text to a server (ours or a provider's)? Read from the code, not from
// the page's words: a page is a "server tool" when its code (page, sibling files, local imports two levels deep)
// calls one of the site's processing APIs or the media service. Used by privacy-claims.mjs (P20, 01/10).
//
// Assets a page DOWNLOADS (ffmpeg core, Tesseract languages, a model) are not uploads and do not count.
import { toolPages, readPage } from './instructions.mjs';

// Endpoint -> who processes the data (for the report; the privacy page names them).
export const ENDPOINTS = [
  { re: /['"`]\/api\/ai(?:['"`/?]|$)/, who: 'OpenAI (via our server)' },
  { re: /\/api\/ai-detect/, who: 'Pangram (via our server)' },
  { re: /\/api\/ai-image/, who: 'OpenAI (via our server)' },
  { re: /\/api\/ai-transcribe/, who: 'OpenAI (via our server)' },
  { re: /\/api\/ai-vision/, who: 'OpenAI (via our server)' },
  { re: /\/api\/convert-html-to-pdf|\/api\/convert-to-pdf/, who: 'our document server (Gotenberg)' },
  { re: /\/api\/image-upscale/, who: 'our server' },
  { re: /\/api\/media\/ticket|runMediaJob|mediaJob/, who: 'our media server (ffmpeg)' },
  { re: /\/api\/pdf-compress|\/api\/pdf-repair|\/api\/pdf-to-pdfa/, who: 'our PDF server' },
  { re: /\/api\/pdf-to-excel|\/api\/pdf-to-ppt|\/api\/pdf-to-word/, who: 'ConvertAPI / our server' },
  { re: /\/api\/remove-bg/, who: 'our background-removal server' },
  { re: /aiClient|callAi\(|askAi\(/, who: 'OpenAI (via our server)' },
  { re: /officeUpload|uploadStaged|\/staged/, who: 'our document server' },
];

export function serverUse(code) {
  return [...new Set(ENDPOINTS.filter((e) => e.re.test(code)).map((e) => e.who))];
}

export function classify() {
  return toolPages().map(({ slug, file }) => {
    const page = readPage(file);
    return { slug, file, ...page, server: serverUse(page.code) };
  });
}

const isMain = process.argv[1] && import.meta.filename && process.argv[1].endsWith('server-tools.mjs');
if (isMain) {
  const all = classify();
  const s = all.filter((p) => p.server.length);
  for (const p of s) console.log(p.slug.padEnd(42), p.server.join(' + '));
  console.log(`${s.length} server tools, ${all.length - s.length} in-browser tools`);
}
