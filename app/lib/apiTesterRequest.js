// API Tester (P37): builds the fetch() arguments from the page's fields; used only by
// app/tools/developer-tools/api-tester/page.jsx. Tested by scripts/p37/api-tester.test.mjs.
//
// - The address must be an absolute http:// or https:// URL. fetch() resolves anything else against
//   the page's own address, so "/api/users" or "api.example.com/users" went to this site with the
//   typed headers and body. Postman adds http:// to an address typed without one; here the request
//   is refused with a message instead, so nothing is sent to an address the visitor did not type.
// - Header names are case-insensitive (RFC 9110 5.1): a Content-Type typed in any capitalization
//   replaces the default application/json. Spreading both keys into one object made fetch() merge
//   them into one header with two values, "application/json, text/plain".

export function buildApiRequest({ url, method, headersText, body }) {
  const address = url.trim();
  let parsed;
  try { parsed = new URL(address); } catch { parsed = null; }
  if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
    throw new Error('Type the full address of the API, starting with https:// or http:// (for example https://api.example.com/users). The request was not sent.');
  }
  const extra = headersText.trim() ? JSON.parse(headersText) : {};
  if (extra === null || typeof extra !== 'object' || Array.isArray(extra)) {
    throw new Error('Headers must be a JSON object, for example {"Authorization": "Bearer token"}. The request was not sent.');
  }
  const hasBody = Boolean(body) && method !== 'GET' && method !== 'HEAD';
  const typed = Object.keys(extra).some((k) => k.toLowerCase() === 'content-type');
  const headers = hasBody && !typed ? { 'Content-Type': 'application/json', ...extra } : { ...extra };
  const init = { method, headers };
  if (hasBody) init.body = body;
  return { url: address, init };
}
