import Script from 'next/script';
import { adsEnabled, adsenseClient, CONSENT_REGIONS } from '../lib/ads';

// Renders nothing while ads are off (app/lib/ads.js). When on:
// 1. Consent Mode v2 defaults, BEFORE Analytics or AdSense run: denied in the EEA, the UK and Switzerland until the
//    visitor answers Google's consent message, granted elsewhere (where no prior consent is required).
// 2. The AdSense script, after the page has loaded and the browser is idle (lazyOnload), so ads never slow down the
//    first paint or the tool (Lighthouse budget of docs/audit/RAPPORT-prelancement-01-10.md §2). It also brings
//    Google's certified consent message (configured in AdSense → Privacy & messaging).
export default function AdsScripts() {
  if (!adsEnabled()) return null;
  const regions = JSON.stringify(CONSENT_REGIONS);
  return (
    <>
      <Script id="consent-defaults" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', region: ${regions}, wait_for_update: 500 });
        gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
      ` }} />
      <Script
        id="adsense"
        strategy="lazyOnload"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient()}`}
      />
    </>
  );
}
