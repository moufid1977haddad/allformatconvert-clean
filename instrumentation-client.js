// Runs before the site becomes interactive, on every page (Next.js: the documented place for polyfills).
// Standard APIs Safari 16.4-18 / iOS 16.4-18 lack, added only when missing: app/lib/polyfills.js.
import { installPolyfills } from './app/lib/polyfills';

try { installPolyfills(); } catch (e) { console.warn('[polyfills]', e); } // a polyfill must never stop the page
