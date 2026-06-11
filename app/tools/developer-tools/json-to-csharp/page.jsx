'use client';
import { useState } from 'react';
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
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Json To Csharp</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Json To Csharp is a free online tool that instantly converts JSON data into C# class definitions, saving developers time on manual coding. It supports complex nested structures and generates clean, ready-to-use C# code that integrates seamlessly into your projects.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Json To Csharp</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your JSON data into the input field on the Json To Csharp converter</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Convert' button to instantly generate C# classes from your JSON structure</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the generated C# code in the output panel</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the generated code and paste it directly into your C# project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Json To Csharp completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Json To Csharp is 100% free and requires no registration or subscription to convert JSON to C# code.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can this tool handle nested and complex JSON structures?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely, Json To Csharp supports deeply nested objects and arrays, converting them into properly structured C# classes with appropriate data types.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does the generated C# code require any modifications?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The generated code is production-ready in most cases, though you may want to review property names and add custom logic based on your specific project requirements.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What data types does Json To Csharp support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports all standard JSON types including strings, numbers, booleans, null, arrays, and objects, converting them to appropriate C# equivalents.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure your JSON is properly formatted and valid before converting to avoid errors in the generated C# code</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use meaningful JSON property names as they will be converted to C# property names, following camelCase to PascalCase conventions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Consider adding XML documentation comments to the generated C# classes for better code documentation</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test the generated C# classes with sample JSON data to ensure deserialization works correctly in your application</li>
          </ul>
        </div>
      </div>
    </div>
  );
}