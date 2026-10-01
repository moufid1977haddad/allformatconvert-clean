import { chromium } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path';
const d = process.env.TEMP + '/p23';
fs.writeFileSync(d + '/empty.png', Buffer.alloc(0));
const b = Buffer.alloc(512); for (let i = 0; i < 512; i++) b[i] = (i * 2654435761 >>> 13) & 255; fs.writeFileSync(d + '/corrupt.png', b);
fs.writeFileSync(d + '/corrupt.mp4', b); fs.writeFileSync(d + '/empty.mp4', Buffer.alloc(0));
fs.writeFileSync(d + '/wrong.mp4', Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'));
const sites = [
  ['iloveimg-crop', 'https://www.iloveimg.com/crop-image', ['empty.png', 'corrupt.png']],
  ['iloveimg-watermark', 'https://www.iloveimg.com/watermark-image', ['corrupt.png']],
  ['clideo-watermark', 'https://clideo.com/add-watermark-to-video', ['empty.mp4', 'corrupt.mp4', 'wrong.mp4']],
  ['clideo-merge', 'https://clideo.com/merge-video', ['corrupt.mp4']],
];
const br = await chromium.launch();
for (const [n, url, files] of sites) for (const f of files) {
  const p = await br.newPage();
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await p.waitForTimeout(3000);
    const before = await p.locator('body').innerText();
    await p.locator('input[type=file]').first().setInputFiles(path.join(d, f), { timeout: 10000 });
    await p.waitForTimeout(15000);
    const after = await p.locator('body').innerText();
    const bl = new Set(before.split('\n').map(s => s.trim()));
    const fresh = after.split('\n').map(s => s.trim()).filter(s => s && !bl.has(s)).slice(0, 12);
    console.log(`== ${n} ${f}:`, JSON.stringify(fresh));
  } catch (e) { console.log(`== ${n} ${f}: ERR`, e.message.slice(0, 120)); }
  await p.close();
}
await br.close();
