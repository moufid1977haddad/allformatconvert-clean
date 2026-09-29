// iPhone video previews (30/09, owner: Video Trimmer's result stayed white; the source played full screen). With an
// iPhone user agent (the site-wide IosVideoFirstFrame module turns on), every <video> must carry playsinline, and the
// trimmed result must load and sit on its first image (currentTime 0.001) without a tap. Chromium, VP9 WebM source.
// Usage: node scripts/browser-tests/ios-video-first-frame.mjs <origin>   (MEDIA_FFMPEG)
import { chromium, devices } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'iosff-')), 'clip.webm');
execFileSync(process.env.MEDIA_FFMPEG, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc=s=320x240:r=25:d=6', '-c:v', 'libvpx-vp9', '-b:v', '300k', '-g', '25', f]);
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'], acceptDownloads: true });
const p = await ctx.newPage();
await p.goto(origin + '/tools/video-tools/video-trimmer', { waitUntil: 'networkidle' });
await p.locator('input[type=file]').first().setInputFiles(f);
await p.waitForTimeout(1500);
await p.getByRole('button', { name: /Trim/ }).first().click();
await p.locator('video[data-preview]').waitFor({ timeout: 120000 });
await p.waitForTimeout(2000);
const r = await p.evaluate(() => [...document.querySelectorAll('video')].map((v) => ({ inline: v.hasAttribute('playsinline'), preload: v.preload, ready: v.readyState, t: v.currentTime, result: v.hasAttribute('data-preview') })));
const res = r.find((v) => v.result);
const ok = r.every((v) => v.inline) && res && res.ready >= 1 && res.t > 0 && res.t < 0.1;
console.log(ok ? 'PASS' : 'FAIL', 'iPhone UA: every video inline; trimmed result loaded on its first image', JSON.stringify(r));
await b.close(); process.exit(ok ? 0 : 1);
