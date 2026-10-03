// P29 (04/10): URL to PDF as the site does it — each public page turned by lib/urlFetch/snapshot.mjs (our fetcher and
// sanitizer, run here) into the one self-contained HTML document /api/convert-url-to-pdf sends to Gotenberg. Saved once,
// so both Gotenberg services print exactly the same input (scripts/p27/gotenberg-compare.mjs --extra-html=<dir>).
//   node scripts/p29/url-snapshots.mjs <out-dir>
import fs from 'node:fs';
import path from 'node:path';
import { snapshotPage } from '../../lib/urlFetch/snapshot.mjs';

const out = process.argv[2];
if (!out) { console.error('usage: url-snapshots.mjs <out-dir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
// Static public pages of different kinds: a minimal page, an encyclopedia article (tables, images, many styles), a
// documentation page, a government page, a news front page built partly by scripts.
const pages = {
  'snap-example': 'https://example.com/',
  'snap-wikipedia': 'https://en.wikipedia.org/wiki/Portable_Document_Format',
  'snap-mdn': 'https://developer.mozilla.org/en-US/docs/Web/CSS/@page',
  'snap-govuk': 'https://www.gov.uk/government/organisations/hm-revenue-customs',
  'snap-bbc': 'https://www.bbc.com/news',
};
for (const [name, url] of Object.entries(pages)) {
  try {
    const snap = await snapshotPage(url, { deadline: Date.now() + 55_000 });
    fs.writeFileSync(path.join(out, `${name}.html`), snap.html);
    console.log(`OK   ${name} ${snap.html.length} chars`, JSON.stringify(snap.stats));
  } catch (e) {
    console.log(`FAIL ${name} ${e.code || ''} ${e.message}`);
  }
}
