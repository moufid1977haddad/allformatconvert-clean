// Research probe (26/09/2026), run from a folder holding fx/a.flac, fx/b.flac... (see RAPPORT-audio-merger-format-sortie.md).
import fs from 'node:fs';
import { chromium, firefox } from '@playwright/test';
for (const eng of [chromium, firefox]) {
  const b = await eng.launch(eng === firefox ? { firefoxUserPrefs: { 'media.autoplay.default': 0 } } : {}); const p = await b.newPage();
  await p.goto('https://www.onlineconvertools.com/robots.txt');
  for (const [f, mime] of [['chain.opus', 'audio/ogg'], ['chain.ogg', 'audio/ogg']]) {
    const b64 = fs.readFileSync(f).toString('base64');
    const r = await p.evaluate(async ({ b64, mime }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      let decoded; try { decoded = (await new OfflineAudioContext(1, 1, 48000).decodeAudioData(bytes.buffer.slice(0))).duration; } catch (e) { decoded = 'ERR ' + e.message; }
      const a = new Audio(URL.createObjectURL(new Blob([bytes], { type: mime }))); a.muted = true;
      await new Promise((r) => { a.onloadedmetadata = r; a.onerror = r; setTimeout(r, 8000); });
      const el = a.duration; a.playbackRate = 4;
      const played = await new Promise((r) => { a.onended = () => r(a.currentTime); a.onerror = () => r('err ' + a.error?.code); setTimeout(() => r('timeout at ' + a.currentTime), 20000); a.play().catch((e) => r('play ' + e.message)); });
      return { decoded, el, played };
    }, { b64, mime });
    console.log(eng.name(), f, JSON.stringify(r));
  }
  await b.close();
}
