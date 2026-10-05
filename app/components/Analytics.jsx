'use client';
import { useEffect } from 'react';

const GA_ID = 'G-7GFHW05JLH';

// P35 (lot 2 — audit A1): Google Analytics only where the server says it may run (app/api/analytics-consent): never in
// the EEA, the United Kingdom and Switzerland, nor when the country is unknown (app/lib/analyticsRegion.js). Nothing of
// Google's is requested before that answer, and a failed answer loads nothing.
// As before (27/09), Analytics waits for the page to have loaded and the browser to be idle: it does not compete with
// the tool's own code on a phone. Mounted once in the root layout: client-side navigations keep it (GA's own history
// listener counts them, as before).
export default function Analytics() {
  useEffect(() => {
    let cancelled = false;
    const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1));
    const start = async () => {
      let allowed = false;
      try {
        const res = await fetch('/api/analytics-consent', { cache: 'no-store' });
        allowed = res.ok && (await res.json()).analytics === true;
      } catch { /* no answer: nothing is loaded */ }
      if (!allowed) {
        // a visitor of these regions who came before 06/10 still holds Analytics cookies: they are removed (review)
        const names = document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^_ga(_|$)/.test(n));
        const host = window.location.hostname;
        for (const n of names) for (const d of ['', `; domain=${host}`, `; domain=.${host.replace(/^www\./, '')}`]) document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
        return;
      }
      if (cancelled || window.__octAnalyticsLoaded) return;
      window.__octAnalyticsLoaded = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA_ID);
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(s);
    };
    const onLoad = () => idle(start);
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
    return () => { cancelled = true; window.removeEventListener('load', onLoad); };
  }, []);
  return null;
}
