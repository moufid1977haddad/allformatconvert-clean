// P37 lot 1, bug 8: Android tablets were treated as computers by app/lib/isMobileDevice.js.
// Real user-agent strings (and the Client Hints Chromium exposes) for tablets, phones and computers.
// Run: node scripts/p37/isMobileDevice.test.mjs            (working tree)
//      SRC_REV=HEAD node scripts/p37/isMobileDevice.test.mjs (before the fix)
import { load, check, done } from './lot1-load.mjs';

const { isMobileDevice } = await load('app/lib/isMobileDevice.js');
const hints = (platform, mobile) => ({ platform, mobile, brands: [] });

const CASES = [
  // Android tablets: must get the mobile (phone-like) caps
  ['Galaxy Tab S9, Chrome (reduced UA, no "Mobile")', true, { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', maxTouchPoints: 10, userAgentData: hints('Android', false) }],
  ['Galaxy Tab S9, Samsung Internet', true, { userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Safari/537.36', maxTouchPoints: 10, userAgentData: hints('Android', false) }],
  ['Android tablet, Edge', true, { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 EdgA/129.0.0.0', maxTouchPoints: 10, userAgentData: hints('Android', false) }],
  ['Pixel Tablet, Chrome desktop site (Linux UA, hints say Linux)', true, { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', maxTouchPoints: 10, userAgentData: hints('Linux', false) }],
  ['Pixel Tablet, Chrome desktop site (Linux UA, hints say Android)', true, { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', maxTouchPoints: 10, userAgentData: hints('Android', false) }],
  ['Android tablet, Firefox', true, { userAgent: 'Mozilla/5.0 (Android 14; Tablet; rv:131.0) Gecko/131.0 Firefox/131.0', maxTouchPoints: 5 }],
  ['Fire HD 10, Silk', true, { userAgent: 'Mozilla/5.0 (Linux; Android 9; KFTRWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/127.4.1 like Chrome/127.0.6533.103 Safari/537.36', maxTouchPoints: 5, userAgentData: hints('Android', false) }],
  ['Fire HD 10, Silk desktop view', true, { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Silk/127.4.1 like Chrome/127.0.6533.103 Safari/537.36', maxTouchPoints: 5 }],
  // iPad (unchanged)
  ['iPad, Safari (desktop Mac UA + touch)', true, { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15', maxTouchPoints: 5 }],
  ['iPad, Safari mobile site', true, { userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1', maxTouchPoints: 5 }],
  // phones (unchanged)
  ['Pixel 8, Chrome', true, { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36', maxTouchPoints: 5, userAgentData: hints('Android', true) }],
  ['Galaxy S24, Samsung Internet', true, { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36', maxTouchPoints: 5, userAgentData: hints('Android', true) }],
  ['Android phone, Firefox', true, { userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0', maxTouchPoints: 5 }],
  ['iPhone, Safari', true, { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1', maxTouchPoints: 5 }],
  ['iPhone, Chrome', true, { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.46 Mobile/15E148 Safari/604.1', maxTouchPoints: 5 }],
  // computers (unchanged)
  ['Windows, Chrome', false, { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', maxTouchPoints: 0, userAgentData: hints('Windows', false) }],
  ['Windows touch laptop / Surface, Edge', false, { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0', maxTouchPoints: 10, userAgentData: hints('Windows', false) }],
  ['Windows, Firefox', false, { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0', maxTouchPoints: 0 }],
  ['Mac, Safari', false, { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15', maxTouchPoints: 0 }],
  ['Mac, Chrome', false, { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', maxTouchPoints: 0, userAgentData: hints('macOS', false) }],
  ['Linux, Firefox (no touch)', false, { userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', maxTouchPoints: 0 }],
  ['Linux, Chrome (no touch)', false, { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', maxTouchPoints: 0, userAgentData: hints('Linux', false) }],
  ['Chromebook with touch screen', false, { userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', maxTouchPoints: 10, userAgentData: hints('Chrome OS', false) }],
];

const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
for (const [label, expected, nav] of CASES) {
  Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
  const got = isMobileDevice();
  check(`${label}: ${expected ? 'mobile' : 'computer'}`, got === expected, `got ${got ? 'mobile' : 'computer'}`);
}
if (original) Object.defineProperty(globalThis, 'navigator', original); else delete globalThis.navigator;
Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true, writable: true });
check('no navigator (server render): computer', isMobileDevice() === false);
done('isMobileDevice');
