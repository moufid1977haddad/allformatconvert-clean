// Builds fixtures that need a real browser: raster images via <canvas> (png,
// jpg, webp) and a short real video via captureStream()+MediaRecorder (webm).
// Chromium is launched headless via Playwright -- no native canvas binding,
// no ffmpeg, no network required.
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'files');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');

  const images = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 64, 64);
    grad.addColorStop(0, '#ff5050'); grad.addColorStop(1, '#5050ff');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(20, 20, 24, 24);
    const toB64 = (type, quality) => new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      }, type, quality);
    });
    return {
      png: await toB64('image/png'),
      jpg: await toB64('image/jpeg', 0.9),
      webp: await toB64('image/webp', 0.9),
    };
  });
  fs.writeFileSync(path.join(OUT, 'sample.png'), Buffer.from(images.png, 'base64'));
  fs.writeFileSync(path.join(OUT, 'sample.jpg'), Buffer.from(images.jpg, 'base64'));
  fs.writeFileSync(path.join(OUT, 'sample.webp'), Buffer.from(images.webp, 'base64'));
  console.log('wrote sample.png/jpg/webp');

  // SVG is plain text, no browser needed, but keep it here alongside its raster siblings.
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#5050ff"/><circle cx="32" cy="32" r="16" fill="#ffffff"/></svg>';
  fs.writeFileSync(path.join(OUT, 'sample.svg'), svg);
  console.log('wrote sample.svg');

  // Short real WebM via canvas captureStream + MediaRecorder (native Chromium APIs).
  const webmB64 = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(10);
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
    recorder.start();
    let hue = 0;
    const interval = setInterval(() => {
      hue = (hue + 30) % 360;
      ctx.fillStyle = `hsl(${hue},80%,50%)`;
      ctx.fillRect(0, 0, 64, 64);
    }, 100);
    await new Promise((r) => setTimeout(r, 1200));
    clearInterval(interval);
    recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: 'video/webm' });
    const buf = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  });
  fs.writeFileSync(path.join(OUT, 'sample.webm'), Buffer.from(webmB64, 'base64'));
  console.log('wrote sample.webm', Buffer.from(webmB64, 'base64').length, 'bytes');

  await browser.close();
})();
