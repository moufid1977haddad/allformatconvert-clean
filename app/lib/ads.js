// Google AdSense — prepared on 30/09/2026, OFF until the owner turns it on (docs/audit/RAPPORT-prelancement-01-10.md §3).
//
// OFF = NEXT_PUBLIC_ADSENSE_CLIENT is not set in Vercel. Then the site ships no ad code, no consent message, no
// "Privacy choices" link, and the privacy policy has no Advertising section: that is the intended state until the plan's
// traffic threshold, not a fallback value.
// ON  = both variables below are set (Production), then a redeploy:
//   NEXT_PUBLIC_ADSENSE_CLIENT           the publisher id, "ca-pub-" + 16 digits (AdSense → Account → Account information)
//   NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER the id of the display ad unit created for the bottom of tool pages (10 digits)
// A malformed value, or the client without the slot, stops the build with a clear message instead of shipping a site
// whose ads silently never show.
//
// Consent in the EEA, the UK and Switzerland: Google's own certified CMP ("Privacy & messaging" → European regulations
// message, IAB TCF v2.3), configured in the AdSense account; it is delivered by the same AdSense script, so nothing else
// is loaded here. Google Consent Mode v2 defaults below keep Analytics and ads cookie-less in those regions until the
// visitor answers the message (the CMP then updates the consent state itself).

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const SLOT_TOOL_FOOTER = process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER;

if (CLIENT !== undefined && !/^ca-pub-\d{16}$/.test(CLIENT)) {
  throw new Error('NEXT_PUBLIC_ADSENSE_CLIENT must look like "ca-pub-" followed by 16 digits (or be absent to keep ads off).');
}
if (CLIENT !== undefined && !/^\d{10}$/.test(SLOT_TOOL_FOOTER || '')) {
  throw new Error('NEXT_PUBLIC_ADSENSE_CLIENT is set but NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER is missing or not a 10-digit ad unit id.');
}

export const adsEnabled = () => CLIENT !== undefined;
export const adsenseClient = () => CLIENT;
export const adSlots = { toolFooter: SLOT_TOOL_FOOTER };

// EU/EEA (27 + Iceland, Liechtenstein, Norway), United Kingdom, Switzerland — ISO 3166-1 alpha-2, as Consent Mode expects.
export const CONSENT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH',
];
