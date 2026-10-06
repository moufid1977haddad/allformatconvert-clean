'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
// P24 (03/10): three ways to encode, as browserling offers — a component (a query value: & ? / # = encoded), a whole
// URL (its structure : / ? # & = kept, spaces and accents encoded), and strict RFC 3986 (also ! ' ( ) *)
const ENCODERS = {
  component: (s) => encodeURIComponent(s),
  // a whole URL: an escape already there (%20) is kept, not encoded again into %2520 (P24 review)
  url: (s) => s.split(/(%[0-9A-Fa-f]{2})/).map((part, i) => (i % 2 ? part : encodeURI(part))).join(''),
  rfc3986: (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()),
};

export default function UrlEncoderDevPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  // Form data and query strings write a space as "+" (application/x-www-form-urlencoded); decodeURIComponent alone
  // leaves it as "+". On by default, like PHP's urldecode and the decoders that offer the choice; our Encode never
  // outputs a raw "+" (it writes %2B), so a round trip is unchanged.
  const [plusAsSpace, setPlusAsSpace] = useState(true);
  const [encMode, setEncMode] = useState('component');
  const encode = () => { try { setOutput(ENCODERS[encMode](input)); } catch (e) { reportShownMessage(e); setOutput('This text has a broken character (a lone surrogate) that URLs cannot carry.'); } };
  const decode = () => { try { setOutput(decodeURIComponent(plusAsSpace ? input.replace(/\+/g, ' ') : input)); } catch (e) { reportShownMessage(e); setOutput('Invalid URL encoding'); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">URL Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Percent-encode query values and full URLs for code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste URL here..." value={input} onChange={e => setInput(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer"><input type="checkbox" checked={plusAsSpace} onChange={(e) => setPlusAsSpace(e.target.checked)} className="w-4 h-4" />Decode “+” as a space (form data and query strings)</label>
          {plusAsSpace && input.includes('+') && <p className="text-xs text-amber-700" data-plus-note>Each “+” is read as a space here (form encoding). If your text has real plus signs — an e-mail like a+b@x.com, a phone number — untick this box.</p>}
          <label className="flex items-center gap-2 text-sm text-neutral-600">Encode as
            <select id="url-mode" value={encMode} onChange={(e) => setEncMode(e.target.value)} className="border border-neutral-200 rounded px-2 py-1 bg-white max-w-full min-w-0">
              <option value="component">A value (query parameter, path segment)</option>
              <option value="url">A whole URL (keeps : / ? # & = + ; , @ $)</option>
              <option value="rfc3986">Strict RFC 3986 (also ! ' ( ) *)</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Decode</button>
          </div>
          {output && <div className="space-y-2"><TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly />
          <TextDownload text={output} name="encoded.txt" /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title={"URL Encoder"}
        description={"This URL encoder gives the three percent-encodings that JavaScript code usually needs. A value runs encodeURIComponent, which escapes & = ? / # and every other character except letters, digits and - _ . ! ~ * ' ( ), for one query parameter or path segment. A whole URL runs encodeURI between the %XX escapes already present, so the address keeps its structure and %20 never becomes %2520. Strict RFC 3986 also escapes ! ' ( ) *. Decode runs decodeURIComponent and, by default, first reads + as a space, as form data does. The same calls you would write in code run here, on your machine."}
        example={{
          caption: "A query value encoded with \"A value\", then a full address encoded with \"A whole URL\":",
          inputLabel: "Input",
          input: "café au lait & croissants\n\nhttps://example.com/search?q=café au lait&page=2",
          outputLabel: "Encode",
          output: "caf%C3%A9%20au%20lait%20%26%20croissants\n\nhttps://example.com/search?q=caf%C3%A9%20au%20lait&page=2",
        }}
        howToTitle={"How to URL-encode a value or a whole URL"}
        howTo={[
          "Paste a query value, a path segment or a complete URL into the box.",
          "In \"Encode as\", pick \"A value (query parameter, path segment)\", \"A whole URL (keeps : / ? # & = + ; , @ $)\" or \"Strict RFC 3986 (also ! ' ( ) *)\".",
          "Click \"Encode\", or click \"Decode\" to turn %XX escapes back into characters.",
          "Take the encoded string with \"Copy\", or get it as encoded.txt through \"Download\"."
        ]}
        specs={[
          { label: "Encode modes", value: "encodeURIComponent; encodeURI with existing %XX escapes kept; encodeURIComponent plus ! ' ( ) * escaped" },
          { label: "Decode", value: "decodeURIComponent, after turning + into a space unless you untick that box" },
          { label: "Kept by A whole URL", value: "Letters, digits, - _ . ! ~ * ' ( ) and ; / ? : @ & = + $ , #" },
          { label: "Errors", value: "A broken escape gives Invalid URL encoding; a lone surrogate character cannot be encoded" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Encoding and decoding call your browser's own encodeURIComponent, encodeURI and decodeURIComponent inside this page, so the strings you paste, tokens and keys included, are not sent to our servers. When Encode, Decode or a copy to the clipboard fails, we receive the browser's error message, the tool's name and your browser's name and version, without the text that caused it."}
        faqs={[
          { q: "Should I use encodeURIComponent or encodeURI?", a: "Use encodeURIComponent (\"A value\") for a single parameter: it escapes & = ? / # so they cannot end the value early. Use encodeURI (\"A whole URL\") for a complete address that must keep working; it leaves : / ? # & = and + untouched." },
          { q: "Why does + turn into a space when I decode?", a: "The box \"Decode “+” as a space (form data and query strings)\" is ticked by default, matching application/x-www-form-urlencoded data. Untick it when + means a real plus sign, as in a+b@x.com. A value and Strict RFC 3986 encode + as %2B, so their output never contains a raw +." },
          { q: "Are spaces encoded as %20 or +?", a: "As %20, in all three modes. None of them writes + for a space; that convention belongs to HTML form encoding, which this tool reads when decoding but never produces." },
          { q: "Will an already encoded URL be encoded twice?", a: "No with \"A whole URL\": escapes such as %20 are kept, so nothing turns into %2520. Yes with the other two modes, where % itself becomes %25, which is correct when the % character is part of the value." }
        ]}
        tips={[
          "Encode each parameter value with \"A value\" first, then join name=value pairs with & yourself.",
          "\"A whole URL\" leaves + as it is: untick the + box before decoding such a result, or a + in it comes back as a space."
        ]}
      />
    </div>
  );
}