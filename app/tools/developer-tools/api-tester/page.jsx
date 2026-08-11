'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ApiTesterPage() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const send = async () => {
    setLoading(true);
    try {
      const opts = { method, headers: { 'Content-Type': 'application/json', ...(headers ? JSON.parse(headers) : {}) } };
      if (body && method !== 'GET') opts.body = body;
      const res = await fetch(url, opts);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      setResponse({ status: res.status, statusText: res.statusText, data });
    } catch(e) { setResponse({ error: e.message }); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">API Tester</h1>
        <p className="text-neutral-500 text-center mb-8">Test REST API endpoints</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-3">
            <select value={method} onChange={e => setMethod(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-semibold">
              {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m}>{m}</option>)}
            </select>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="https://api.example.com/endpoint" />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Headers (JSON)</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm h-16 resize-none font-mono" placeholder='{"Authorization": "Bearer token"}' value={headers} onChange={e => setHeaders(e.target.value)} /></div>
          {method !== 'GET' && <div><label className="block text-sm text-neutral-500 mb-1">Body</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm h-32 resize-none font-mono" placeholder='{"key": "value"}' value={body} onChange={e => setBody(e.target.value)} /></div>}
          <button onClick={send} disabled={!url || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{loading ? 'Sending...' : 'Send Request'}</button>
          {response && <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-2"><div className={response.error ? 'text-red-400' : response.status < 400 ? 'text-green-400' : 'text-yellow-400'}>{response.error ? response.error : `${response.status} ${response.statusText}`}</div><pre className="font-mono text-sm overflow-x-auto text-indigo-400">{JSON.stringify(response.data, null, 2)}</pre></div>}
        </div>
      </div>
      <SeoContent
        title="API Tester"
        description="API Tester sends HTTP requests directly from your browser to the endpoint you specify, using the browser's own fetch() API, and shows the response status and body. Nothing passes through our servers, but since it's a request from your browser, cross-origin APIs that don't send permissive CORS headers will block the response just like on any web page."
        howTo={[
          "Select the HTTP method (GET, POST, PUT, DELETE, or PATCH) and type the endpoint URL.",
          "Optionally add request headers as JSON, e.g. {\"Authorization\": \"Bearer token\"}.",
          "For non-GET methods, add a request body.",
          "Click 'Send Request' to view the response status and body."
        ]}
        faqs={[
          { q: "Is API Tester free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I test APIs from different domains?", a: "Yes, but the browser's CORS policy still applies — if the API doesn't send permissive CORS headers, the browser will block reading the response, same as on any web page." },
          { q: "What HTTP methods are supported?", a: "GET, POST, PUT, DELETE, and PATCH. HEAD and OPTIONS aren't available in the method selector." },
          { q: "Can I save my requests for later?", a: "No, there's no save or history feature — each request is one-off, and refreshing the page clears everything." }
        ]}
        tips={[
          "Headers must be valid JSON, e.g. {\"Authorization\": \"Bearer token\"} — invalid JSON will prevent the request from sending.",
          "CORS restrictions are enforced by the browser, not by this tool, so some APIs are only testable from a server-side tool without those restrictions.",
          "The response body is pretty-printed automatically when it's valid JSON; otherwise it displays as raw text.",
          "Since nothing is saved, copy down any request details you want to reuse before navigating away."
        ]}
      />
    </div>
  );
}