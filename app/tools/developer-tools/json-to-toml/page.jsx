'use client';
import { useState } from 'react';
export default function JsonToTomlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const lines = [];
      Object.entries(obj).forEach(([k,v]) => {
        if (typeof v === 'object' && v !== null) {
          lines.push('[' + k + ']');
          Object.entries(v).forEach(([k2,v2]) => {
            const val = typeof v2 === 'string' ? '"' + v2 + '"' : v2;
            lines.push(k2 + ' = ' + val);
          });
        } else {
          const val = typeof v === 'string' ? '"' + v + '"' : v;
          lines.push(k + ' = ' + val);
        }
      });
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to TOML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to TOML format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TOML Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Json To Toml</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Json To Toml is a free online converter that instantly transforms JSON data into TOML format without requiring any software installation. This powerful tool is perfect for developers, DevOps engineers, and configuration managers who need seamless format conversion.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Json To Toml</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your JSON code into the input field on the left side of the converter</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Convert' button to automatically transform your JSON into TOML format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the converted TOML output displayed on the right side of the screen</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the TOML result and paste it into your configuration files or text editor</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the difference between JSON and TOML?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">JSON is a lightweight data interchange format using curly braces and quotes, while TOML is a configuration file format designed for human readability with simpler syntax and minimal punctuation.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using Json To Toml?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all conversions are processed directly in your browser without sending data to external servers, ensuring complete privacy and security of your information.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert large JSON files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Json To Toml can handle most JSON files, though extremely large files may take a few moments to process depending on your browser's performance capabilities.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to sign up or install anything?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Json To Toml is completely free and requires no registration, login, or software installation to use.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Validate your JSON syntax before conversion to ensure accurate TOML output and avoid conversion errors</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Json To Toml for configuration files in projects using languages like Rust, Python, or Ruby that commonly use TOML</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy your converted TOML output immediately after conversion as browser tabs may refresh and lose the result</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare the original JSON and converted TOML side-by-side to understand how nested objects translate into TOML table syntax</li>
          </ul>
        </div>
      </div>
    </div>
  );
}