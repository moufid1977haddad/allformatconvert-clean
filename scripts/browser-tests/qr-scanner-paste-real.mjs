// QR Scanner, paste of an image from the REAL system clipboard (Windows): a QR code PNG is put in the clipboard by
// PowerShell (System.Windows.Forms.Clipboard.SetImage, what a screenshot tool does), then Ctrl+V is pressed in a
// visible browser window. improvement-17.mjs only dispatches a scripted ClipboardEvent (and cannot at all in Firefox).
// Overwrites the clipboard's content. Windows only.
// Usage: node scripts/browser-tests/qr-scanner-paste-real.mjs <origin> [--browser=firefox]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import QRCode from 'qrcode';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const isFx = process.argv.includes('--browser=firefox');
const TEXT = 'https://www.onlineconvertools.com/paste-test?id=' + Date.now();
const png = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qr-paste-')), 'qr.png');
fs.writeFileSync(png, await QRCode.toBuffer(TEXT, { width: 360, margin: 4 }));
execFileSync('powershell', ['-NoProfile', '-STA', '-Command', `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; [System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${png}'))`]);

const b = await (isFx ? firefox : chromium).launch({ headless: false });
const ctx = await b.newContext(isFx ? {} : { permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
await p.goto(origin + '/tools/qr-barcodes-tools/qr-scanner', { waitUntil: 'networkidle' });
await p.locator('body').click({ position: { x: 5, y: 5 } });
await p.keyboard.press('Control+V');
const got = await p.locator('[data-text]').textContent({ timeout: 15000 }).catch(() => null);
console.log(got === TEXT ? 'PASS' : 'FAIL', `real clipboard paste (${isFx ? 'firefox' : 'chromium'}, headed): ${got === TEXT ? 'decoded the pasted QR' : 'got ' + JSON.stringify(got)}`);
await b.close();
process.exit(got === TEXT ? 0 : 1);
