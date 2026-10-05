// QR Scanner (owner's iPhone, 30/09: a long press on the drop zone offered no "Paste"): the "Paste image" button
// (navigator.clipboard.read) and the editable paste box, with a QR image put in the REAL Windows clipboard by
// PowerShell. Headed browsers. Overwrites the clipboard. Windows only.
// Usage: node scripts/browser-tests/qr-paste-button.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import QRCode from 'qrcode';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.includes('--browser=firefox') ? 'firefox' : process.argv.includes('--browser=webkit') ? 'webkit' : 'chromium';
const engine = { chromium, firefox, webkit }[name];
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function put(text) {
  const png = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qr-paste-')), 'qr.png');
  fs.writeFileSync(png, await QRCode.toBuffer(text, { width: 360, margin: 4 }));
  execFileSync('powershell', ['-NoProfile', '-STA', '-Command', `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; [System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${png}'))`]);
}
const b = await engine.launch({ headless: false });
const ctx = await b.newContext(name === 'chromium' ? { permissions: ['clipboard-read', 'clipboard-write'] } : {});
const p = await ctx.newPage();
await p.goto(origin + '/tools/qr-barcodes-tools/qr-scanner', { waitUntil: 'networkidle' });
// 1. paste box: focus it (a tap on iPhone), then paste
let T = 'PASTE-BOX-' + Date.now(); await put(T);
await p.locator('[data-pastebox]').focus();
if (name === 'webkit') {
  // Playwright's WebKit on Windows does not carry a system-clipboard image into the paste event: the event Safari
  // sends on iPhone (clipboardData.files holding the image) is dispatched instead.
  const bytes = [...(await QRCode.toBuffer(T, { width: 360, margin: 4 }))];
  await p.evaluate((arr) => { const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array(arr)], 'image.png', { type: 'image/png' })); document.querySelector('[data-pastebox]').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }, bytes);
} else await p.keyboard.press('Control+V');
let got = await p.locator('[data-text]').textContent({ timeout: 15000 }).catch(() => null);
check('paste box: pasted image decoded', got === T, JSON.stringify(got));
check('paste box stays empty (the image is not inserted as content)', ((await p.locator('[data-pastebox]').innerHTML()) || '').trim() === '');
// 2. Paste image button (Chromium: permission granted; Firefox/WebKit show their own paste confirmation -- skipped)
if (name === 'chromium') {
  T = 'PASTE-BUTTON-' + Date.now(); await put(T);
  await p.getByRole('button', { name: 'Paste image' }).click();
  got = await p.locator('[data-text]').textContent({ timeout: 15000 }).catch(() => null);
  check('Paste image button: clipboard image decoded', got === T, JSON.stringify(got));
  // text in the clipboard: a clear message
  execFileSync('powershell', ['-NoProfile', '-STA', '-Command', "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetText('just text')"]);
  await p.getByRole('button', { name: 'Paste image' }).click();
  const st = await p.locator('[role=status]').filter({ hasText: /\S/ }).first().textContent({ timeout: 10000 }).catch(() => '');
  check('Paste image with text in the clipboard: says so', /no image/i.test(st), st);
}
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${name})`); process.exit(fails ? 1 : 0);
