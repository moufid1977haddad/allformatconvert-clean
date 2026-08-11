'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToPhpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'string', number: 'float', boolean: 'bool' };
      const lines = ['<?php','','class Root {'];
      Object.entries(obj).forEach(([k,v]) => {
        const phpType = Array.isArray(v) ? 'array' : (typeMap[typeof v] || 'mixed');
        lines.push('  public ' + phpType + ' $' + k + ';');
      });
      lines.push('}');
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to PHP Class</h1>
        <p className="text-neutral-500 text-center mb-8">Generate PHP classes from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">PHP Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to PHP Class"
        description="JSON to PHP Class generates a class definition with one typed property per top-level JSON key — not a PHP array or object populated with your actual data — entirely in your browser. It uses PHP 7.4+ typed property syntax (e.g. public float $age;), so the output requires PHP 7.4 or later and is not compatible with PHP 5.4 as sometimes assumed."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate a PHP class with typed properties.",
          "Review the output — this defines the shape of your data, not a filled-in array.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to PHP Class free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it generate a PHP array or object containing my actual JSON data?", a: "No — it generates a class definition with typed property declarations, such as public string $name;, not a populated array like ['name' => 'John']." },
          { q: "What PHP version does the generated code require?", a: "PHP 7.4 or later, since it uses typed property syntax. It will not work on PHP 5.4 through 7.3." },
          { q: "Does it handle nested JSON objects?", a: "No — only top-level keys become typed properties; nested objects are typed as mixed and arrays as array, without generating separate nested classes." }
        ]}
        tips={[
          "If you need your actual JSON values as a PHP array, use PHP's own json_decode($json, true) instead — this tool only generates a class shape, not populated data.",
          "For nested objects, manually create additional classes and update the generated property types to reference them.",
          "Typed properties require PHP 7.4+; avoid them or add compatibility handling if you must support older PHP.",
          "Property names are used exactly as written in your JSON, without case conversion — rename them by hand if you want camelCase."
        ]}
      />
    </div>
  );
}