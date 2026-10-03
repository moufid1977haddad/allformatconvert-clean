// P26 E1 — LOCAL BENCH ONLY, loaded into `next start` with NODE_OPTIONS=--import. Answers in place of
//  - ConvertAPI (pdf/to/docx, pdf/to/rtf): a REAL earlier ConvertAPI output (FAKE_CONVERTAPI_DOCX / _RTF), so no
//    paid conversion is made (P26 rule: no spending outside the Railway bill);
//  - Supabase (quota counters, usage events, error rows): neutral "allowed" answers, so nothing is written there
//    (P26 rule: nothing on Supabase). Every other request goes out unchanged (our pdf-tools and media services).
// Each interception is appended to FAKE_LOG (host + path only, never a header or a body) as proof.
import fs from 'node:fs';

const realFetch = globalThis.fetch;
const log = (line) => { if (process.env.FAKE_LOG) fs.appendFileSync(process.env.FAKE_LOG, `${new Date().toISOString()} ${line}\n`); };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

globalThis.fetch = async function patchedFetch(input, init) {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname === 'v2.convertapi.com') {
    const sent = init?.body && typeof init.body.get === 'function' ? init.body.get('File')?.name || '' : '';
    const file = /\/pdf\/to\/rtf$/.test(url.pathname) ? process.env.FAKE_CONVERTAPI_RTF
      : /textbox/i.test(sent) ? process.env.FAKE_CONVERTAPI_DOCX_TEXTBOX : process.env.FAKE_CONVERTAPI_DOCX;
    log(`convertapi ${url.pathname} -> ${file ? 'real earlier output' : 'MISSING'}`);
    if (!file) return json({ Code: 5000, Message: 'bench: no file' }, 500);
    return json({ ConversionCost: 1, Files: [{ FileName: 'x', FileData: fs.readFileSync(file).toString('base64') }] });
  }
  let configured = '';
  try { configured = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://none.invalid').hostname; } catch { /* unset */ }
  if (url.hostname.endsWith('.supabase.co') || url.hostname === configured) {
    log(`supabase ${url.pathname}`);
    const body = init?.body ? (() => { try { return JSON.parse(String(init.body)); } catch { return {}; } })() : {};
    const rpc = /\/rest\/v1\/rpc\/([a-z_]+)/.exec(url.pathname)?.[1];
    if (rpc === 'increment_usage_counter') return json([{ new_value: body.p_amount || 1, allowed: true }]);
    if (rpc === 'increment_usage_counters_all_or_none') return json((body.p_buckets || []).map((_, i) => ({ idx: i, new_value: body.p_amounts?.[i] || 1, allowed: true, over_cap: false })));
    if (rpc === 'adjust_usage_counter') return json(0);
    if (rpc) return json(null);
    return new Response(init?.method === 'GET' || !init?.method ? '[]' : null, { status: init?.method && init.method !== 'GET' ? 201 : 200, headers: { 'Content-Type': 'application/json' } });
  }
  return realFetch(input, init);
};
log('fake-providers loaded');
