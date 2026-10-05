import { analyticsAllowed, requestCountry } from '@/app/lib/analyticsRegion';

// P35 (lot 2): may this page load Google Analytics? No in the EEA, the UK and Switzerland, and when the country is
// unknown (app/lib/analyticsRegion.js). The answer depends on the visitor: never cached (no shared cache, no browser
// cache), and the country itself is not sent back.
export const dynamic = 'force-dynamic';

export function GET(req) {
  return Response.json(
    { analytics: analyticsAllowed(requestCountry(req.headers)) },
    { headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
  );
}
