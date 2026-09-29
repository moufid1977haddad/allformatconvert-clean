// The REAL media service (production), for a deployed preview or www: same interface as local-media-service.mjs.
// Tickets come from the site under test (/api/media/ticket, 20 per hour per address). The service only adds CORS
// headers for its ALLOWED_ORIGINS (www): for a preview served elsewhere, `corsShim` relays its calls through
// Playwright and adds that header, nothing else (as audio-opus-real.mjs). `jobs` counts the jobs the pages create.
export function realMediaService({ origin, corsShim = false }) {
  const jobs = [];
  return {
    jobs,
    async routeTickets(ctx) {
      await ctx.route(/railway\.app/, async (r) => {
        const req = r.request();
        if (req.method() === 'POST' && /\/v1\/jobs$/.test(new URL(req.url()).pathname)) jobs.push({ op: JSON.parse(req.postData() || '{}').op });
        if (!corsShim) return r.continue();
        const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'Authorization, Content-Type, X-Chunk-Sha256', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS', 'access-control-expose-headers': '*' };
        if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
        const resp = await r.fetch();
        return r.fulfill({ response: resp, headers: { ...resp.headers(), ...cors } });
      });
    },
    stop() {},
  };
}
