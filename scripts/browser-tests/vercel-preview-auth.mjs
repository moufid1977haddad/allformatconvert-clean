// Protected Vercel previews: when VERCEL_OIDC_TOKEN is set (node --env-file=.env.local, after `vercel link`), every
// request to OUR origin carries it as x-vercel-trusted-oidc-idp-token (Vercel's Trusted Sources). Only that origin:
// the token never goes to a third-party site the same test visits (ezyZip). No-op without a token.
export async function authorize(context, origin) {
  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!token || !/\.vercel\.app$/.test(new URL(origin).hostname)) return;
  await context.route((url) => url.origin === origin, (route) => route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': token } }));
}
