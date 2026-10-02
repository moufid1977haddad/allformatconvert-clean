// P23 probe: what the page really shows after a bad file (and after its main button).
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const [origin, slug, file, button, eng = 'chromium'] = process.argv.slice(2);
const b = await { chromium, firefox, webkit }[eng].launch();
const ctx = await b.newContext(); await ctx.route('**/api/**', (r) => r.fulfill({ status: 204, body: '' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text().slice(0, 150)));
await p.goto(`${origin}/tools/${slug}`); await p.waitForTimeout(800);
const files = file.split('+');
await p.locator('input[type=file]').first().setInputFiles(files);
await p.waitForTimeout(Number(process.env.WAIT || 3000));
if (button) { await p.getByRole('button', { name: new RegExp(button, 'i') }).first().click({ timeout: 5000 }).catch((e) => console.log('noclick', e.message.slice(0, 80))); await p.waitForTimeout(8000); }
const t = await p.locator('main').first().innerText();
console.log(t.split('\n').filter(Boolean).slice(0, 14).join(' ⏎ ').slice(0, 900)); console.log('ERR', errs.slice(0, 3));
await b.close();
