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
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your URL or text here..." value={text} onChange={e => setText(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer"><input type="checkbox" checked={plusAsSpace} onChange={(e) => setPlusAsSpace(e.target.checked)} className="w-4 h-4" />Decode “+” as a space (form data and query strings)</label>
          {plusAsSpace && text.includes('+') && <p className="text-xs text-amber-700" data-plus-note>Each “+” is read as a space here (form encoding). If your text has real plus signs — an e-mail like a+b@x.com, a phone number — untick this box.</p>}
          <label className="flex items-center gap-2 text-sm text-neutral-600">Encode as
            <select id="url-mode" value={encMode} onChange={(e) => setEncMode(e.target.value)} className="border border-neutral-200 rounded px-2 py-1 bg-white max-w-full min-w-0">
              <option value="component">A value (query parameter, path segment)</option>
              <option value="url">A whole URL (keeps : / ? # & = + ; , @ $)</option>
              <option value="rfc3986">Strict RFC 3986 (also ! ' ( ) *)</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!text} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Encode</button>
            <button onClick={decode} disabled={!text} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Decode</button>
          </div>
          {result && (
            <div className="space-y-2">
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <TextDownload text={result} name="encoded.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"URL Encoder"}
        description={"URL Encoder makes ordinary text safe to put in a web address, and turns encoded addresses back into readable words. Spaces become %20, an accented letter becomes its UTF-8 bytes (é is %C3%A9), and in the default mode symbols such as & or ? are escaped so they do not cut a link short. Paste a long link full of %20 and %C3 codes and Decode shows it in plain text. You can encode a single word or phrase, a complete address, or use a strict variant that also escapes ! ' ( ) *. The conversion uses functions built into your browser, so nothing is uploaded."}
        example={{
          caption: "A song title encoded with the default mode and with the strict mode, then a form-style query decoded with the + box ticked:",
          inputLabel: "Text",
          input: "Rock 'n' Roll (live)!\n\nTo decode: Rock+%27n%27+Roll",
          outputLabel: "Result",
          output: "Default mode: Rock%20'n'%20Roll%20(live)!\nStrict RFC 3986: Rock%20%27n%27%20Roll%20%28live%29%21\n\nDecoded: Rock 'n' Roll",
        }}
        howToTitle={"How to encode or decode text for a link"}
        howTo={[
          "Type or paste your text, or an address full of %XX codes.",
          "To encode, keep \"A value (query parameter, path segment)\" for a word or phrase, or switch to \"A whole URL (keeps : / ? # & = + ; , @ $)\" for a full address.",
          "Click \"Encode\" or \"Decode\"; if a + in your text is a real plus sign, untick the + box first.",
          "Click \"Copy\" to paste the result somewhere else, or \"Download\" for a text file named encoded.txt."
        ]}
        specs={[
          { label: "What gets encoded", value: "Spaces, accents, emoji and symbols; letters, digits and - _ . ~ always stay as they are" },
          { label: "Modes", value: "A value, A whole URL, and Strict RFC 3986, which also escapes ! ' ( ) *" },
          { label: "Decoding", value: "%XX codes are read as UTF-8; + becomes a space unless you untick the box" },
          { label: "Errors", value: "An incomplete code, such as %E9 alone, shows Invalid URL encoding" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"This page converts your text with functions built into the browser and does not send it anywhere, so private links and search terms stay on your device. If the clipboard refuses a copy or a decode fails, we receive a short error message, the tool's name and your browser's name and version, never your text, to help fix bugs."}
        faqs={[
          { q: "How do I decode a URL full of %20 and %C3 codes?", a: "Paste it and click \"Decode\". Each %XX group is read as a UTF-8 byte, so %C3%A9 becomes é and %20 becomes a space. If the address contains a real plus sign, untick the + box first, or it turns into a space." },
          { q: "Why does é become %C3%A9 and not %E9?", a: "Web addresses use UTF-8, where é takes two bytes, C3 and A9. %E9 is the older Latin-1 code; on its own it is not valid UTF-8, so Decode answers Invalid URL encoding instead of guessing." },
          { q: "Which characters are left as they are?", a: "In the default mode, letters, digits and - _ . ! ~ * ' ( ) stay unchanged and everything else is escaped. Strict RFC 3986 escapes ! ' ( ) * as well, and A whole URL also keeps the separators of an address, such as : / ? # & =." },
          { q: "Can I encode a whole web address?", a: "Yes, with \"A whole URL (keeps : / ? # & = + ; , @ $)\". It keeps the separators and any %XX codes already there, and encodes spaces and accents, so the link still opens. In the default mode the slashes and the colon would be escaped too." }
        ]}
        tips={[
          "A link copied from an e-mail that looks broken can be decoded first, to read the address it really points to.",
          "Encode search words separately, then put them after ?q= in the address."
        ]}
      />
    </div>
  );
}