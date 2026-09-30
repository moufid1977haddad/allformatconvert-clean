// Google Translate's element script (~100 KB of JavaScript plus its CSS and images, ≈ 0.3 s of main-thread work on a
// mid-range phone, measured by Lighthouse on 30/09/2026) used to load on EVERY page for EVERY visitor, although only
// the few who pick a language need it. It now loads:
//   - when the visitor opens or uses the language menu (Navbar), and
//   - at page load only if a translation is already active (Google stores it in the `googtrans` cookie, e.g.
//     "/en/fr"; the element re-applies it by itself on every new page, exactly as before).
// Same script, same options as before: nothing changes for a visitor who translates.
const SRC = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

export function loadGoogleTranslate() {
  if (typeof window === 'undefined' || window.__octGoogleTranslateRequested) return;
  window.__octGoogleTranslateRequested = true;
  window.googleTranslateElementInit = function googleTranslateElementInit() {
    new window.google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'en,fr,es,zh-CN,ar,de,pt,ja,ru,it,ko,hi,tr',
      autoDisplay: false,
    }, 'google_translate_element');
  };
  const s = document.createElement('script');
  s.src = SRC;
  s.async = true;
  document.body.appendChild(s);
}

// True when the googtrans cookie asks for a language other than English ("/en/en" = back to the original).
export function translationActive() {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  if (!m) return false;
  const target = decodeURIComponent(m[1]).split('/').pop();
  return Boolean(target) && target !== 'en';
}
