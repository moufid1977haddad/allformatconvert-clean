'use client';
import { useState } from 'react';
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
          <button onClick={send} disabled={!url || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Sending...' : 'Send Request'}</button>
          {response && <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-2"><div className={response.error ? 'text-red-400' : response.status < 400 ? 'text-green-400' : 'text-yellow-400'}>{response.error ? response.error : `${response.status} ${response.statusText}`}</div><pre className="font-mono text-sm overflow-x-auto text-indigo-400">{JSON.stringify(response.data, null, 2)}</pre></div>}
        </div>
      </div>
    </div>
  );
}