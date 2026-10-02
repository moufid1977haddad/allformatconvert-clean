// P23 probe: the page's alerts / red text after a file is chosen (and after an optional button).
import { chromium, firefox, webkit } from '@playwright/test';
const [origin, slug, file, button, eng = 'chromium'] = process.argv.slice(2);
const b = await { chromium, firefox, webkit }[eng].launch(); const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto(`${origin}/tools/${slug}`); await p.waitForTimeout(800);
await p.locator('input[type=file]').first().setInputFiles(file.split('+'));
await p.waitForTimeout(Number(process.env.WAIT || 3000));
const show = async (when) => console.log(when, JSON.stringify((await p.locator('main [role=alert], main .text-red-400, main .text-red-500, main .text-red-600').allInnerTexts()).filter(Boolean)), errs);
await show('after file:');
if (button) { await p.getByRole('button', { name: new RegExp(button, 'i') }).first().click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(Number(process.env.WAIT2 || 8000)); await show('after button:'); }
await b.close();
