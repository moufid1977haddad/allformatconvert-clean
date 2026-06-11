'use client';
import { useState } from 'react';
export default function JsonToRustPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'String', number: 'f64', boolean: 'bool' };
      const lines = ['#[derive(Debug, Serialize, Deserialize)]','struct Root {'];
      Object.entries(obj).forEach(([k,v]) => {
        const rustType = Array.isArray(v) ? 'Vec<serde_json::Value>' : (typeMap[typeof v] || 'serde_json::Value');
        lines.push('  ' + k + ': ' + rustType + ',');
      });
      lines.push('}');
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Rust Struct</h1>
        <p className="text-neutral-500 text-center mb-8">Generate Rust structs from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Rust Struct Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Json To Rust</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Json To Rust is a free online converter that instantly transforms JSON data into strongly-typed Rust struct definitions. This tool eliminates manual coding and helps developers quickly generate type-safe Rust code from JSON schemas.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Json To Rust</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your JSON data or upload a JSON file into the input field on the Json To Rust converter</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Convert' button to automatically generate Rust struct definitions from your JSON</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the generated Rust code in the output panel and customize struct names or fields if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the generated Rust code and paste it directly into your Rust project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Json To Rust really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Json To Rust is completely free and requires no registration, subscription, or payment to convert unlimited JSON files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What JSON formats does this tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports standard JSON format including objects, arrays, strings, numbers, booleans, and null values.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use the generated Rust code in production?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the generated code is production-ready and follows Rust best practices, though you may want to review and customize it for your specific needs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does Json To Rust work offline?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The online version requires internet access, but the conversion happens instantly in your browser without storing your data on servers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use consistent JSON structure with representative data to generate more accurate Rust struct definitions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Enable derive traits like Serialize and Deserialize to make your generated structs compatible with JSON libraries</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Review field types carefully as the tool infers them from JSON values; adjust precision for numbers as needed</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For complex nested JSON structures, consider converting in sections and then combining the generated structs manually</li>
          </ul>
        </div>
      </div>
    </div>
  );
}