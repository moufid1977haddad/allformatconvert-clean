// Which tools send something to a server in AT LEAST ONE case (a mode, a format or a browser), read in the code:
// a tool page (or a file next to it) that uses one of the site's server paths. Everything else runs entirely in the
// browser. Used by docs/lancement/galerie.mjs so the "about N run entirely in your browser" figure is measured, and
// kept in step with the list in app/privacy/page.jsx.
//   node scripts/count-server-tools.mjs        -> prints the counts and the list
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'app', 'tools');
// app/lib/mediaJob.js (our ffmpeg/storage service), officeUpload.js (Office/ConvertAPI/transcription), opusService.js,
// aiClient.js (OpenAI/Pangram through /api), the two shared service components, and direct /api calls.
const SERVER = /mediaJob|officeUpload|opusService|aiClient|MediaServiceTool|GifFromVideoTool|\/api\/(ai|ai-detect|ai-image|ai-transcribe|ai-vision|convert|image-upscale|remove-bg|pdf-)/;

export function countServerTools() {
  const server = [];
  let total = 0;
  for (const cat of fs.readdirSync(root).sort()) {
    const cdir = path.join(root, cat);
    if (!fs.statSync(cdir).isDirectory()) continue;
    for (const t of fs.readdirSync(cdir).sort()) {
      const tdir = path.join(cdir, t);
      if (!fs.statSync(tdir).isDirectory()) continue;
      const files = fs.readdirSync(tdir);
      if (!files.some((f) => /^page\.(jsx|tsx|js)$/.test(f))) continue;
      total++;
      if (files.filter((f) => /\.(jsx|js|tsx)$/.test(f)).some((f) => SERVER.test(fs.readFileSync(path.join(tdir, f), 'utf8')))) server.push(`${cat}/${t}`);
    }
  }
  return { total, server, local: total - server.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { total, server, local } = countServerTools();
  console.log(`${total} tool pages: ${local} entirely in the browser, ${server.length} use a server in at least one case`);
  for (const s of server) console.log('  ' + s);
}
