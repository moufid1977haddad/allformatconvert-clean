// P17 step 3: do real players honour the rotation matrix that Video Rotator writes (lossless path)? Test video: a
// 640x360 landscape frame, red band at the top, green at the left, blue at the bottom. After a 90° clockwise turn the
// shown frame must be 360x640 with green at the TOP and red at the RIGHT. Each engine's own rendering of <video> is
// captured (element screenshot) and the bands located. Usage: node scripts/browser-tests/rotation-players.mjs <dir>
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2];
const color = ([r, g, b]) => (r > 180 && g < 80 && b < 80 ? 'red' : g > 90 && r < 80 && b < 80 ? 'green' : b > 180 && r < 80 && g < 80 ? 'blue' : 'gray');
for (const engine of [chromium, firefox, webkit]) {
  const b = await engine.launch();
  for (const f of ['src.mp4', 'rot90.mp4', 'rot90.mov']) {
    const p = await b.newPage();
    await p.setContent('<video muted playsinline style="display:block"></video>');
    const b64 = fs.readFileSync(path.join(dir, f)).toString('base64');
    const r = await p.evaluate(async ({ b64, f }) => {
      const v = document.querySelector('video');
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      v.src = URL.createObjectURL(new Blob([bytes], { type: f.endsWith('.mov') ? 'video/quicktime' : 'video/mp4' }));
      try { await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('cannot play: ' + (v.error && v.error.code))); setTimeout(() => rej(new Error('timeout')), 8000); }); } catch (e) { return { error: e.message }; }
      v.currentTime = 1; await new Promise((res) => { v.onseeked = res; setTimeout(res, 2000); });
      return { w: v.videoWidth, h: v.videoHeight };
    }, { b64, f });
    if (r.error) { console.log(engine.name(), f, r.error); await p.close(); continue; }
    const shot = await p.locator('video').screenshot();
    const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
    const at = (x, y) => { const i = (Math.floor(y) * info.width + Math.floor(x)) * info.channels; return color([data[i], data[i + 1], data[i + 2]]); };
    const W = info.width, H = info.height;
    const shown = { top: at(W / 2, H * 0.04), right: at(W * 0.96, H / 2), bottom: at(W / 2, H * 0.96), left: at(W * 0.04, H / 2) };
    const turned = shown.top === 'green' && shown.right === 'red' && W < H;
    console.log(engine.name().padEnd(8), f.padEnd(10), `video ${r.w}x${r.h}, shown ${W}x${H}`, JSON.stringify(shown), f === 'src.mp4' ? '(source)' : turned ? 'ROTATION APPLIED' : 'ROTATION IGNORED');
    await p.close();
  }
  await b.close();
}
