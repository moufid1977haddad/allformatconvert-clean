'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { useToolError } from '../../../lib/useToolError';
export default function UrlParserPage() {
  const [url, setUrl] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useToolError('');
  const parse = () => {
    try {
      const u = new URL(url);
      const params = Object.create(null);
      // A repeated key (?tag=a&tag=b) keeps every value; it used to keep the last one only (29/09).
      u.searchParams.forEach((v,k) => { params[k] = Object.prototype.hasOwnProperty.call(params, k) ? params[k] + ', ' + v : v; });
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
          <button onClick={parse} disabled={!url} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Parse URL</button>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {parsed && <div className="space-y-2">{Object.entries(parsed).filter(([k]) => k !== 'params').map(([k,v]) => <div key={k} className="flex gap-3 bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="text-neutral-500 text-sm w-24">{k}</span><span className="font-mono text-sm text-indigo-400 break-all">{v || '—'}</span></div>)}{Object.keys(parsed.params).length > 0 && <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3"><div className="text-neutral-500 text-sm mb-2">Query Params</div>{Object.entries(parsed.params).map(([k,v]) => <div key={k} className="flex gap-2 text-sm"><span className="text-green-400">{k}</span><span className="text-neutral-500">=</span><span className="text-indigo-400">{v}</span></div>)}</div>}</div>}
        </div>
      </div>
      <SeoContent
        title={"URL Parser"}
        description={"URL Parser splits an address with the URL class built into your browser, the parser browsers use to follow links. It shows protocol, hostname, port, pathname, search and hash, then lists every query parameter with its value decoded (%C3%A9 becomes é and + becomes a space); a key that appears twice keeps both values, separated by a comma. The address is shown as the browser normalizes it: lower-case host, ../ segments resolved, punycode for international domain names. Username, password and origin are not displayed, and the hostname is not split into subdomain and domain."}
        example={{
          caption: "An address with a mixed-case host, a ../ segment, a repeated key and an encoded value:",
          inputLabel: "URL",
          input: "https://Shop.Example.com:8443/a/../docs/list?tag=red&tag=blue&q=caf%C3%A9+au+lait#reviews",
          outputLabel: "Parse URL",
          output: "protocol   https:\nhostname   shop.example.com\nport       8443\npathname   /docs/list\nsearch     ?tag=red&tag=blue&q=caf%C3%A9+au+lait\nhash       #reviews\n\nQuery Params\ntag = red, blue\nq = café au lait",
        }}
        howToTitle={"How to parse a URL"}
        howTo={[
          "Paste the full address, starting with its scheme, such as https://.",
          "Click \"Parse URL\"; an address the browser cannot read gives Invalid URL.",
          "Read the protocol, hostname, port, pathname, search and hash rows; an empty one shows a dash.",
          "Check each parameter under \"Query Params\", where values are already decoded."
        ]}
        specs={[
          { label: "Parser", value: "The browser's URL class (WHATWG URL Standard)" },
          { label: "Rows shown", value: "protocol, hostname, port, pathname, search, hash, then Query Params" },
          { label: "Query values", value: "Decoded; a repeated key keeps all its values, joined with a comma" },
          { label: "Not shown", value: "Username, password and origin; subdomain and registered domain are not separated" }
        ]}
        privacyTitle={"Where your URL is processed"}
        privacy={"The address is parsed by your browser in this page and is not sent to our servers. The rows appear as page text, so if you turn on a translation in the language menu, Google receives them: turn translation off before parsing links that carry tokens or keys. When an address cannot be parsed, we receive the message Invalid URL, the tool's name and your browser's name and version."}
        faqs={[
          { q: "Why is my URL invalid?", a: "A missing scheme is the most common cause: example.com/page is refused, while https://example.com/page works. A space inside the host name or a port above 65535 also makes the browser refuse the address." },
          { q: "Why does localhost:3000 show localhost: as the protocol?", a: "The URL parser reads a word followed by a colon at the start of an address as a scheme. Write http://localhost:3000 to get the hostname localhost and the port 3000." },
          { q: "Why is the port empty for https://example.com:443?", a: "The parser drops a port that matches the scheme's default, and 443 is the default port of https. The same happens with :80 on an http address." },
          { q: "Are query values shown decoded?", a: "Yes. In Query Params, %XX sequences are decoded as UTF-8 and + becomes a space, the way form data is read. The search row keeps the raw query string exactly as it appears in the address." }
        ]}
        tips={[
          "To encode a value before adding it to a query string, use URL Encoder.",
          "Paste a link from an e-mail here to see its real host before you open it."
        ]}
      />
    </div>
  );
}