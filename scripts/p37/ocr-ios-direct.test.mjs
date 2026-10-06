// P37 (06/10, lot 2 point 1) — PDF OCR on iPhone / iPad goes straight to our OCR service.
// A real iPhone pass on 2026-10-06 showed the device never finishes ("Drawing the page… 0 %"), then our service read the
// 3 pages after the 20 s wait. The decision "device first or our service first" is the pure function
// app/lib/ocrFirstStep.js; this test runs it on real user agents, and checks that the page uses it.
//   node scripts/p37/ocr-ios-direct.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `— ${info}`); };

let mod = null;
try {
  mod = await import('../../app/lib/ocrFirstStep.js');
} catch (e) {
  check('app/lib/ocrFirstStep.js can be imported', false, e.message.split('\n')[0]);
}

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.122 Mobile/15E148 Safari/604.1',
  ipadOld: 'Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1',
  ipadDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  androidTablet: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  linux: 'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
};

if (mod) {
  const { ocrFirstStep } = mod;
  const cases = [
    ['iPhone Safari', { userAgent: UA.iphone, platform: 'iPhone', maxTouchPoints: 5 }, 'server'],
    ['iPhone Chrome (CriOS)', { userAgent: UA.iphoneChrome, platform: 'iPhone', maxTouchPoints: 5 }, 'server'],
    ['iPad, older iPad user agent', { userAgent: UA.ipadOld, platform: 'iPad', maxTouchPoints: 5 }, 'server'],
    ['iPadOS that says "Macintosh", with touch', { userAgent: UA.ipadDesktop, platform: 'MacIntel', maxTouchPoints: 5 }, 'server'],
    ['Mac Safari, no touch', { userAgent: UA.macSafari, platform: 'MacIntel', maxTouchPoints: 0 }, 'device'],
    ['Mac with one touch point (not an iPad)', { userAgent: UA.macSafari, platform: 'MacIntel', maxTouchPoints: 1 }, 'device'],
    ['Android phone', { userAgent: UA.android, platform: 'Linux armv8l', maxTouchPoints: 5 }, 'device'],
    ['Android tablet', { userAgent: UA.androidTablet, platform: 'Linux armv8l', maxTouchPoints: 10 }, 'device'],
    ['Windows Chrome with a touch screen', { userAgent: UA.windows, platform: 'Win32', maxTouchPoints: 10 }, 'device'],
    ['Linux Firefox', { userAgent: UA.linux, platform: 'Linux x86_64', maxTouchPoints: 0 }, 'device'],
    ['no navigator (server render)', undefined, 'device'],
  ];
  for (const [name, nav, want] of cases) {
    const got = ocrFirstStep(nav);
    check(`${name} → ${want}`, got === want, `got ${got}`);
  }
  check('test hook window.__forceServerPageRender = true → server (desktop UA)', ocrFirstStep({ userAgent: UA.windows, platform: 'Win32', maxTouchPoints: 0 }, true) === 'server');
  check('a hook that is not exactly true changes nothing', ocrFirstStep({ userAgent: UA.windows, platform: 'Win32', maxTouchPoints: 0 }, 'yes') === 'device');
}

// The page uses the decision: on iPhone / iPad no local engine is started, the notice is shown before "Run OCR".
const page = fs.readFileSync(path.join(ROOT, 'app', 'tools', 'pdf-tools', 'pdf-ocr', 'page.jsx'), 'utf8');
check('page.jsx imports ocrFirstStep', /import \{[^}]*\bocrFirstStep\b[^}]*\} from '[^']*ocrFirstStep(\.js)?'/.test(page));
check('page.jsx no longer waits LOCAL_OCR_LIMIT_MS on iPhone / iPad before our service', !/LOCAL_OCR_LIMIT_MS/.test(page));
check('page.jsx loads tesseract.js only when the device reads the pages', /if \(!serverFirst\)[\s\S]{0,400}import\('tesseract\.js'\)/.test(page));

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
