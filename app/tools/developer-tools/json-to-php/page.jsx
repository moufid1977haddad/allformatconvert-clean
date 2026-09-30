'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToPhpArray, jsonToPhpClass } from '../../../lib/jsonToPhp';
import { TextDownload } from '../../../components/FileDownload';
export default function JsonToPhpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('array');
  const convert = () => {
    try {
      setOutput(mode === 'array' ? jsonToPhpArray(input) : jsonToPhpClass(input));
      setError('');
    } catch(e) { setOutput(''); setError(e instanceof SyntaxError ? 'Invalid JSON: ' + e.message : e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to PHP Class</h1>
        <p className="text-neutral-500 text-center mb-8">Generate PHP classes from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">PHP Output</label><textarea aria-label="PHP Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.php" /></div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm" role="radiogroup" aria-label="Output">
            <label className="flex items-center gap-2"><input type="radio" name="php-mode" checked={mode === 'array'} onChange={() => setMode('array')} /> PHP array (the data, as json_decode($json, true) returns it)</label>
            <label className="flex items-center gap-2"><input type="radio" name="php-mode" checked={mode === 'class'} onChange={() => setMode('class')} /> PHP classes (typed, PHP 8+)</label>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"JSON to PHP Class"}
        description={"JSON to PHP converts JSON into PHP code, entirely in your browser — nothing is uploaded to a server. Two outputs: a PHP array literal holding your actual data (short [] syntax, exactly what json_decode($json, true) returns — strings escaped, numbers written as in your JSON, integers beyond PHP_INT_MAX kept as strings so no digit is lost), or PHP 8 classes describing its shape: one class per nested object, typed promoted properties, nullable types for fields that are null or missing, arrays of objects mapped to their own class, keys such as \"first-name\" turned into valid camelCase properties, and a fromArray() factory that reads the original JSON keys."}
        howTo={[
          "Paste your JSON into the input box.",
          "Choose 'PHP array' to get your data as a PHP array, or 'PHP classes' to get typed classes.",
          "Click 'Convert'.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to PHP Class free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can it produce a PHP array with my actual JSON data?", a: "Yes — choose 'PHP array'. The output is the same array json_decode($json, true) would give, written as a [ 'key' => value ] literal you can paste into code or a config file." },
          { q: "What PHP version does the generated code require?", a: "The PHP array works on PHP 5.4 and later (short array syntax). The classes use constructor property promotion and named arguments, so they require PHP 8.0 or later." },
          { q: "Does it handle nested JSON objects?", a: "Yes — in class mode each nested object becomes its own class, and an array of objects is mapped with array_map to that class in fromArray(). In array mode, nesting is kept as nested arrays." },
          { q: "What happens to very large integers?", a: "An integer larger than PHP_INT_MAX is written as a string, as json_decode() does with JSON_BIGINT_AS_STRING — as a PHP float it would silently lose digits." }
        ]}
        tips={[
          "For configuration files, 'PHP array' gives you a ready return [...] body.",
          "In class mode, paste several array elements so fields that are sometimes missing become nullable.",
          "Property names are converted to camelCase; fromArray() still reads the original JSON keys.",
          "Rename the Root class to something specific to your data."
        ]}
      />
    </div>
  );
}