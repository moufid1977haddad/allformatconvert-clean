'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';

// P24 (03/10): three ways to encode, as browserling offers — a component (a query value: & ? / # = encoded), a whole
// URL (its structure : / ? # & = kept, spaces and accents encoded), and strict RFC 3986 (also ! ' ( ) *)
const ENCODERS = {
  component: (s) => encodeURIComponent(s),
  // a whole URL: an escape already there (%20) is kept, not encoded again into %2520 (P24 review)
  url: (s) => s.split(/(%[0-9A-Fa-f]{2})/).map((part, i) => (i % 2 ? part : encodeURI(part))).join(''),
  rfc3986: (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()),
};

export default function UrlEncoderPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [copyError, setCopyError] = useState(false);
  // Form data and query strings write a space as "+" (application/x-www-form-urlencoded); decodeURIComponent alone
  // leaves it as "+". On by default, like PHP's urldecode and the decoders that offer the choice; our Encode never
  // outputs a raw "+" (it writes %2B), so a round trip is unchanged.
  const [plusAsSpace, setPlusAsSpace] = useState(true);
  const [encMode, setEncMode] = useState('component');
  const encode = () => { try { setResult(ENCODERS[encMode](text)); } catch { setResult('This text has a broken character (a lone surrogate) that URLs cannot carry.'); } };
  const decode = () => {
    try {
      setResult(decodeURIComponent(plusAsSpace ? text.replace(/\+/g, ' ') : text));
    } catch(e) {
      reportShownMessage(e);
      setResult('Invalid URL encoding');
    }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">URL Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode URLs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your URL or text here..." value={text} onChange={e => setText(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer"><input type="checkbox" checked={plusAsSpace} onChange={(e) => setPlusAsSpace(e.target.checked)} className="w-4 h-4" />Decode “+” as a space (form data and query strings)</label>
          {plusAsSpace && text.includes('+') && <p className="text-xs text-amber-700" data-plus-note>Each “+” is read as a space here (form encoding). If your text has real plus signs — an e-mail like a+b@x.com, a phone number — untick this box.</p>}
          <label className="flex items-center gap-2 text-sm text-neutral-600">Encode as
            <select id="url-mode" value={encMode} onChange={(e) => setEncMode(e.target.value)} className="border border-neutral-200 rounded px-2 py-1 bg-white">
              <option value="component">A value (query parameter, path segment)</option>
              <option value="url">A whole URL (keeps : / ? # & =)</option>
              <option value="rfc3986">Strict RFC 3986 (also ! ' ( ) *)</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!text} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Encode</button>
            <button onClick={decode} disabled={!text} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Decode</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <TextDownload text={result} name="encoded.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="URL Encoder"
        description="URL Encoder converts special characters and spaces into percent-encoded format (and back again), using the browser's built-in encodeURIComponent/decodeURIComponent, entirely in your browser."
        howTo={[
          "Paste your URL or text into the input field.",
          "Click \"Encode\" to convert special characters to percent-encoded format, or \"Decode\" to reverse a percent-encoded string.",
          "Review the result in the output field.",
          "Click \"Copy\" to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What is URL encoding and why do I need it?", a: "URL encoding converts special characters into a format safe for transmission in URLs. Characters like spaces, ampersands, and slashes are replaced with percent signs followed by hexadecimal values." },
          { q: "Is URL Encoder free to use?", a: "Yes, it's completely free with no signup and no limits." },
          { q: "Can I decode URLs too?", a: "Yes, the \"Decode\" button converts percent-encoded text back to its readable form; invalid encoded input shows an error message instead of crashing." },
          { q: "Which characters get encoded?", a: "Spaces, accented letters, symbols, and reserved characters like &, ?, #, and / are encoded. Letters, numbers, hyphens, underscores, periods, and tildes are left unchanged, matching the standard encodeURIComponent behavior. With 'A whole URL', the characters that give a URL its structure (: / ? # & =) are kept, as are escapes already there (%20 stays %20); 'Strict RFC 3986' also encodes ! ' ( ) *." }
        ]}
        tips={[
          "Encode query parameter values individually before building a URL, so characters like & or = inside a value don't break the URL structure.",
          "If \"Decode\" shows \"Invalid URL encoding,\" the input contains a malformed percent sequence — double check it was copied completely.",
          "Test your encoded URL in a browser address bar to confirm it resolves to the correct destination.",
          "Keep the original, unencoded text handy for reference before re-encoding after edits."
        ]}
      />
    </div>
  );
}