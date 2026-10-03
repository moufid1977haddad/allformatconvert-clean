// P26: reach a protected Vercel preview from Playwright with the caller's short-lived development OIDC token
// (`vercel env run -- node <bench>`), added ONLY to requests for the preview's own origin -- never to the media
// service, fonts or any other host. Never printed.
export async function previewAuth(ctx, origin) {
  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!token || !/\.vercel\.app$/.test(new URL(origin).hostname)) return false;
  await ctx.route((url) => url.origin === origin, (route) => route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': token } }));
  return true;
}
