'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToCsharpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'string', number: 'double', boolean: 'bool' };
      const lines = ['public class Root','{'];
      Object.entries(obj).forEach(([k,v]) => {
        const csType = Array.isArray(v) ? 'List<object>' : (typeMap[typeof v] || 'object');
        const name = k.charAt(0).toUpperCase() + k.slice(1);
        lines.push('  public ' + csType + ' ' + name + ' { get; set; }');
      });
      lines.push('}');
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to C# Class</h1>
        <p className="text-neutral-500 text-center mb-8">Generate C# classes from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">C# Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to C# Class"
        description="JSON to C# Class generates a single 'Root' class with one property per top-level JSON key, entirely in your browser — nothing is uploaded to a server. Strings, numbers, and booleans map to string, double, and bool; arrays always become a generic List of object, and nested objects become plain object, since nested values aren't recursively converted into their own classes."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate a C# class from the top-level properties.",
          "Review the output — adjust types and add nested classes by hand where needed.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to C# Class free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it handle nested objects and arrays as their own classes?", a: "No — only top-level keys become typed properties. Nested objects are typed as plain object and arrays as List<object>, rather than generating separate nested classes." },
          { q: "Is the generated code ready to use as-is?", a: "For flat JSON with simple string, number, and boolean values, yes. For nested data, you'll need to manually define and wire up additional classes for the nested structures." },
          { q: "Is my data uploaded to a server?", a: "No, generation happens entirely in your browser." }
        ]}
        tips={[
          "Property names are capitalized only on the first letter (e.g. first_name becomes First_name, not FirstName) — rename them by hand if you want strict PascalCase.",
          "For nested objects or arrays of objects, manually create additional classes and update the generated property types to match.",
          "Numbers always map to double, even if your data is really an integer — change the type if you need int or decimal precision.",
          "Test deserialization with real sample data, especially for any properties you retype after generation."
        ]}
      />
    </div>
  );
}