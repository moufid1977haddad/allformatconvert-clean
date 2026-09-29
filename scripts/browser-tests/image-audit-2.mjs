// Image tools, audit of 29/09 (second pass): each check states the CORRECT behaviour; run against the build before the
// fixes it shows the defects, after them it must pass. Inputs are generated in the page (canvas), results are read back
// pixel by pixel. Oracles: the browser's own CSS filters (grayscale, same matrix as the spec), exact geometry
// (rotation size, corner transparency, circular arc), exact means (pixelation by block average).
// Usage: node scripts/browser-tests/image-audit-2.mjs <origin> [--browser=chromium|firefox|webkit] [--only=<check name>]
import { chromium, firefox, webkit } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const b = await ({ chromium, firefox, webkit })[name].launch();
const ctx = await b.newContext();
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
let fails = 0, passes = 0;
const errors = [];
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
let page;
const open = async (path) => { page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`${path}: ${e.message}`)); await page.goto(origin + path, { waitUntil: 'networkidle' }); };
// kinds: 'holed' (transparent 40x40 with an opaque red 20x20 centre), 'blue' (opaque 0,0,255 40x40),
// 'checker' (1-px black/white 40x40), 'wide' (60x20 red left half, blue right half), 'photo' (JPEG 40x40 gradient)
const makeImage = (kind) => page.evaluate(async (k) => {
  const c = document.createElement('canvas');
  const x = c.getContext('2d');
  let type = 'image/png';
  if (k === 'holed') { c.width = c.height = 40; x.fillStyle = '#f00'; x.fillRect(10, 10, 20, 20); }
  if (k === 'blue') { c.width = c.height = 40; x.fillStyle = '#00f'; x.fillRect(0, 0, 40, 40); }
  if (k === 'checker') { c.width = c.height = 40; for (let y = 0; y < 40; y++) for (let i = 0; i < 40; i++) { x.fillStyle = (i + y) % 2 ? '#fff' : '#000'; x.fillRect(i, y, 1, 1); } }
  if (k === 'wide') { c.width = 60; c.height = 20; x.fillStyle = '#f00'; x.fillRect(0, 0, 30, 20); x.fillStyle = '#00f'; x.fillRect(30, 0, 30, 20); }
  if (k === 'photo') { c.width = c.height = 40; const g = x.createLinearGradient(0, 0, 40, 40); g.addColorStop(0, '#236'); g.addColorStop(1, '#fc8'); x.fillStyle = g; x.fillRect(0, 0, 40, 40); type = 'image/jpeg'; }
  const bl = await new Promise((r) => c.toBlob(r, type, 0.95));
  return { bytes: Array.from(new Uint8Array(await bl.arrayBuffer())), type };
}, kind);
const upload = async (kind, filename) => { const im = await makeImage(kind); await page.locator('input[type="file"]').first().setInputFiles({ name: filename, mimeType: im.type, buffer: Buffer.from(im.bytes) }); };
// Reads the result (href of a download link, or a data URL) : { type, w, h, px(x,y) }
const read = async (href) => page.evaluate(async (u) => {
  const blob = await (await fetch(u)).blob();
  const img = new Image(); img.src = URL.createObjectURL(blob); await img.decode();
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  return { type: blob.type, w: c.width, h: c.height, data: Array.from(d) };
}, href);
const px = (r, x, y) => { const i = (y * r.w + x) * 4; return r.data.slice(i, i + 4); };
const resultHref = async (sel) => page.locator(sel).first().getAttribute('href', { timeout: 20000 });
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
const T = async (n, fn) => { if (only && !n.startsWith(only)) return; try { await fn(); } catch (e) { fails++; console.log('FAIL', `${name} ${n}`, String(e.message).split('\n')[0].slice(0, 200)); } finally { if (page) await page.close().catch(() => {}); page = null; } };

await T('add-border', async () => {
  await open('/tools/image-tools/add-border-to-image');
  await upload('holed', 'logo.png');
  await page.getByRole('button', { name: 'Add Border' }).click();
  const r = await read(await resultHref('a[download^="bordered"]'));
  const b0 = r.w - 40; // border width x2
  check('add-border: the transparent areas of the image stay transparent (inside the border)', px(r, b0 / 2 + 2, b0 / 2 + 2)[3] === 0, JSON.stringify(px(r, b0 / 2 + 2, b0 / 2 + 2)));
});
await T('format kept', async () => {
  await open('/tools/image-tools/image-inverter');
  await upload('photo', 'photo.jpg');
  await page.getByRole('button', { name: 'Invert Colors' }).click();
  const href = await resultHref('a[download]');
  const r = await read(href);
  const dl = await page.locator('a[download]').first().getAttribute('download');
  check('filters keep a JPEG photo in JPEG (as iLoveIMG / Pinetools), file named accordingly', r.type === 'image/jpeg' && /\.jpe?g$/.test(dl), `${r.type} ${dl}`);
});
await T('grayscale', async () => {
  await open('/tools/image-tools/grayscale-converter');
  await upload('blue', 'blue.png');
  await page.getByRole('button', { name: 'Convert to Grayscale' }).click();
  const r = await read(await resultHref('a[download]'));
  const ref = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); if (!('filter' in x)) return null; x.filter = 'grayscale(1)'; x.fillStyle = '#00f'; x.fillRect(0, 0, 1, 1); return x.getImageData(0, 0, 1, 1).data[0]; });
  const expected = ref ?? 18; // CSS grayscale(1) matrix: 0.0722 * 255 = 18.4
  check('grayscale: pure blue gives the luminance of blue (CSS grayscale / Rec. 709), not the plain average 85', Math.abs(px(r, 5, 5)[0] - expected) <= 2, `got ${px(r, 5, 5)[0]}, expected ${expected}`);
});
await T('pixelator', async () => {
  await open('/tools/image-tools/image-pixelator');
  await upload('checker', 'checker.png');
  await page.locator('input[type="range"]').first().fill('10');
  await page.getByRole('button', { name: 'Apply Pixelate' }).click();
  const r = await read(await resultHref('a[download]'));
  const v = px(r, 3, 3)[0];
  check('pixelator: each block is the AVERAGE of its pixels (as the page says): 1-px checkerboard -> mid grey', v > 110 && v < 145, `got ${v}`);
});
await T('round-corners', async () => {
  await open('/tools/image-tools/round-corners');
  await upload('blue', 'blue.png');
  await page.locator('input[type="range"]').first().fill('50'); // radius = 50% of half the short side = 10 px
  await page.getByRole('button', { name: 'Apply Round Corners' }).click();
  const r = await read(await resultHref('a[download]'));
  // circle of radius 10 centred (10,10): the point at 45 deg just inside the arc is opaque, just outside is transparent
  const inside = px(r, 4, 4)[3];   // distance to centre = 8.5 < 10
  const outside = px(r, 2, 2)[3];  // distance to centre = 11.3 > 10
  check('round-corners: a true circular arc (as CSS border-radius): inside opaque, outside transparent', inside > 200 && outside < 60, `inside ${inside}, outside ${outside}`);
});
await T('image-editor rotate', async () => {
  await open('/tools/image-tools/image-editor');
  await upload('wide', 'wide.png');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Transform/ }).click();
  await page.locator('input[type="range"]').first().fill('90');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.waitForTimeout(500);
  const r = await read(await page.evaluate(() => document.querySelector('canvas').toDataURL()));
  check('image-editor: rotating 90 deg turns a 60x20 image into 20x60 (nothing cut off)', r.w === 20 && r.h === 60, `${r.w}x${r.h}`);
});
await T('image-editor corners', async () => {
  await open('/tools/image-tools/image-editor');
  await upload('blue', 'blue.png');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Decorate/ }).click();
  await page.locator('input[type="range"]').first().fill('15');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await page.waitForTimeout(500);
  const r = await read(await page.evaluate(() => document.querySelector('canvas').toDataURL()));
  check('image-editor: corner radius makes the corners transparent', px(r, 0, 0)[3] === 0 && px(r, 20, 20)[3] === 255, `corner ${px(r, 0, 0)[3]}, centre ${px(r, 20, 20)[3]}`);
});

await T('duplicate-finder', async () => {
  await open('/tools/image-tools/duplicate-image-finder');
  // the same picture three ways (PNG 40x40, JPEG 40x40, PNG resized 20x20) + an unrelated one + an exact copy
  const set = await page.evaluate(async () => {
    const draw = (w, h, inv) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, inv ? '#fff' : '#000'); g.addColorStop(1, inv ? '#000' : '#fff'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#c00'; x.fillRect(w / 4, h / 4, w / 4, h / 2); return c; };
    const enc = async (c, t) => Array.from(new Uint8Array(await (await new Promise((r) => c.toBlob(r, t, 0.8))).arrayBuffer()));
    return [await enc(draw(40, 40), 'image/png'), await enc(draw(40, 40), 'image/jpeg'), await enc(draw(20, 20), 'image/png'), await enc(draw(40, 40, true), 'image/png')];
  });
  await page.locator('input[type="file"]').setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from(set[0]) },
    { name: 'a-copy.png', mimeType: 'image/png', buffer: Buffer.from(set[0]) },
    { name: 'a.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(set[1]) },
    { name: 'a-small.png', mimeType: 'image/png', buffer: Buffer.from(set[2]) },
    { name: 'other.png', mimeType: 'image/png', buffer: Buffer.from(set[3]) },
  ]);
  const before = await page.locator('body').innerText();
  check('duplicate-finder: no verdict is shown before the search', !/No duplicates/.test(before));
  await page.getByRole('button', { name: /Find Duplicates/ }).click();
  await page.waitForTimeout(1500);
  const t = await page.locator('body').innerText();
  check('duplicate-finder: exact copy found', /Identical files[^\n]*a\.png = a-copy\.png/.test(t));
  check('duplicate-finder: JPEG and resized copies found as the same picture', /Same picture[^\n]*a\.png = a\.jpg/.test(t) && /Same picture[^\n]*a\.png = a-small\.png/.test(t));
  check('duplicate-finder: the unrelated image is not matched', !/other\.png/.test(t.split('Find Duplicates')[1] || ''));
});
await T('image-comparison', async () => {
  await open('/tools/image-tools/image-comparison');
  const two = await page.evaluate(async () => {
    const mk = async (spot) => { const c = document.createElement('canvas'); c.width = c.height = 20; const x = c.getContext('2d'); x.fillStyle = '#08f'; x.fillRect(0, 0, 20, 20); if (spot) { x.fillStyle = '#f00'; x.fillRect(5, 5, 2, 2); } return Array.from(new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/png'))).arrayBuffer())); };
    return [await mk(false), await mk(true)];
  });
  const inputs = page.locator('input[type="file"]');
  await inputs.nth(0).setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: Buffer.from(two[0]) });
  await inputs.nth(1).setInputFiles({ name: 'b.png', mimeType: 'image/png', buffer: Buffer.from(two[1]) });
  await page.getByRole('button', { name: 'Differences' }).click();
  const txt = await page.locator('[data-diff-summary]').innerText({ timeout: 10000 });
  check('image-comparison: the 4 changed pixels are counted', /^4 of 400 pixels differ/.test(txt), txt);
});
await T('image-to-base64', async () => {
  await open('/tools/image-tools/image-to-base64');
  const im = await makeImage('blue');
  await page.locator('input[type="file"]').setInputFiles({ name: 'noext', mimeType: '', buffer: Buffer.from(im.bytes) });
  await page.waitForTimeout(800);
  const val = await page.locator('textarea').first().inputValue().catch(() => '');
  check('image-to-base64: a file of unknown type still gets its real MIME type', val.startsWith('data:image/png;base64,'), val.slice(0, 40));
});

await b.close();
for (const e of errors) { fails++; console.log('PAGE ERROR', e.slice(0, 200)); }
console.log(`${passes} passed, ${fails} failed (${name})`);
process.exit(fails ? 1 : 0);
