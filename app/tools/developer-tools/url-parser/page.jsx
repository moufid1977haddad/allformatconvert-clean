'use client';
import { useState } from 'react';
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
          <button onClick={parse} disabled={!url} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Parse URL</button>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {parsed && <div className="space-y-2">{Object.entries(parsed).filter(([k]) => k !== 'params').map(([k,v]) => <div key={k} className="flex gap-3 bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="text-neutral-500 text-sm w-24">{k}</span><span className="font-mono text-sm text-indigo-400 break-all">{v || '—'}</span></div>)}{Object.keys(parsed.params).length > 0 && <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3"><div className="text-neutral-500 text-sm mb-2">Query Params</div>{Object.entries(parsed.params).map(([k,v]) => <div key={k} className="flex gap-2 text-sm"><span className="text-green-400">{k}</span><span className="text-neutral-500">=</span><span className="text-indigo-400">{v}</span></div>)}</div>}</div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Url Parser</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">URL Parser is a free online tool that instantly breaks down any web address into its component parts, including protocol, domain, path, query parameters, and fragments. This powerful utility helps developers, marketers, and webmasters understand URL structure and extract valuable information for analysis and debugging.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Url Parser</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Navigate to the URL Parser tool and locate the input field at the top of the page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste or type the complete URL you want to analyze into the text box</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Parse' or 'Analyze' button to process your URL</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Review the detailed breakdown showing protocol, hostname, port, path, query strings, and other components</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is a URL and why do I need to parse it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">A URL is a web address that identifies the location of a resource on the internet. Parsing a URL extracts its individual components to better understand its structure, which is useful for development, debugging, and SEO analysis.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the URL Parser tool free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, URL Parser is completely free and requires no registration or subscription. You can parse unlimited URLs without any hidden fees or limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What information does the URL Parser extract?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool extracts protocol, subdomain, domain, top-level domain, port number, path, query parameters, fragments, and other URL components for complete analysis.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe when using URL Parser?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, URL Parser processes your URLs locally in your browser without storing or transmitting your data to external servers, ensuring complete privacy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use URL Parser to identify and fix broken query parameters that might be causing tracking issues or affiliate link problems</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Parse multiple competitor URLs to understand their URL structure and parameter naming conventions for benchmarking purposes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the parsed components and use them in spreadsheets or databases for bulk URL analysis and organization</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Leverage URL Parser when debugging redirect chains by parsing each URL in the sequence to identify configuration errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}