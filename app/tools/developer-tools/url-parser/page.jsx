'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function UrlParserPage() {
  const [url, setUrl] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const parse = () => {
    try {
      const u = new URL(url);
      const params = {};
      u.searchParams.forEach((v,k) => params[k] = v);
      setParsed({ protocol: u.protocol, hostname: u.hostname, port: u.port, pathname: u.pathname, search: u.search, hash: u.hash, params });
      setError('');
    } catch(e) { setError('Invalid URL'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">URL Parser</h1>
        <p className="text-neutral-500 text-center mb-8">Parse and analyze URLs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="https://example.com/path?key=value#hash" />
          <button onClick={parse} disabled={!url} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Parse URL</button>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {parsed && <div className="space-y-2">{Object.entries(parsed).filter(([k]) => k !== 'params').map(([k,v]) => <div key={k} className="flex gap-3 bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="text-neutral-500 text-sm w-24">{k}</span><span className="font-mono text-sm text-indigo-400 break-all">{v || '—'}</span></div>)}{Object.keys(parsed.params).length > 0 && <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3"><div className="text-neutral-500 text-sm mb-2">Query Params</div>{Object.entries(parsed.params).map(([k,v]) => <div key={k} className="flex gap-2 text-sm"><span className="text-green-400">{k}</span><span className="text-neutral-500">=</span><span className="text-indigo-400">{v}</span></div>)}</div>}</div>}
        </div>
      </div>
      <SeoContent
        title="URL Parser"
        description="URL Parser breaks a URL into its components — protocol, hostname, port, path, search string, hash, and query parameters — using the browser's native URL API, entirely in your browser. It parses the full hostname as a single field; it doesn't separately break out the subdomain or top-level domain the way a dedicated domain-parsing tool would."
        howTo={[
          "Paste a full URL, including its protocol (e.g. https://), into the input field.",
          "Click 'Parse URL'.",
          "Review the breakdown: protocol, hostname, port, path, search, and hash.",
          "If the URL has query parameters, review them individually in the Query Params section."
        ]}
        faqs={[
          { q: "Why do I need to parse a URL?", a: "It extracts the individual components of a URL, useful for debugging, understanding link structure, or inspecting query parameters." },
          { q: "Is it free to use?", a: "Yes, completely free with no registration required." },
          { q: "Does it split the hostname into subdomain and top-level domain?", a: "No — the full hostname is shown as one field; it's not further broken down into subdomain, domain, and TLD." },
          { q: "Is my URL sent to a server?", a: "No, parsing uses the browser's native URL API and happens entirely locally." }
        ]}
        tips={[
          "Always include the protocol (https:// or http://) — without one, the URL is treated as invalid.",
          "Use the Query Params section to quickly check individual parameter values without manually splitting the query string.",
          "This is a genuine URL parser (the browser's built-in URL class), so it correctly rejects malformed URLs rather than guessing.",
          "For domain-only analysis (subdomain vs. root domain), a dedicated domain-parsing tool will give a more detailed breakdown."
        ]}
      />
    </div>
  );
}