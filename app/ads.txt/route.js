import { adsEnabled, adsenseClient } from '../lib/ads';

// /ads.txt (IAB "Authorized Digital Sellers"), required by AdSense: built from NEXT_PUBLIC_ADSENSE_CLIENT so the owner
// never edits a file by hand. While ads are off it answers 404, like before this route existed.
// f08c47fec0942fa0 is Google's certification authority id, the value AdSense gives every publisher for this line.
export const dynamic = 'force-static';

export function GET() {
  if (!adsEnabled()) return new Response('Not found', { status: 404 });
  const pub = adsenseClient().replace(/^ca-/, '');
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
