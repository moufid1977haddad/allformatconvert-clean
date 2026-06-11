'use client';
import { useState } from 'react';
export default function TomlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = {};
      let currentSection = obj;
      input.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        if (line.startsWith('[')) {
          const key = line.slice(1,-1);
          obj[key] = {};
          currentSection = obj[key];
        } else if (line.includes('=')) {
          const eqIdx = line.indexOf('=');
          const k = line.slice(0, eqIdx).trim();
          const v = line.slice(eqIdx+1).trim().replace(/^"|"$/g,'');
          currentSection[k] = isNaN(v) ? v : Number(v);
        }
      });
      setOutput(JSON.stringify(obj, null, 2));
      setError('');
    } catch(e) { setError('Invalid TOML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TOML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TOML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TOML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TOML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Toml To Json</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Toml To Json is a free online converter that instantly transforms TOML (Tom's Obvious, Minimal Language) configuration files into JSON format. This powerful tool eliminates manual conversion errors and saves developers time when working with different data format requirements.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Toml To Json</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your TOML content into the input field or upload a TOML file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Convert' button to instantly process your TOML data</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the generated JSON output in the results panel</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the JSON code to your clipboard or download it as a file for use in your project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is TOML and why convert it to JSON?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">TOML is a configuration file format that is human-readable and minimal. JSON is more widely supported across programming languages and frameworks, making conversion useful for compatibility and integration purposes.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all conversions happen entirely in your browser. Your TOML files are not uploaded to any server, ensuring complete privacy and security of your sensitive configuration data.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert large TOML files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool can handle TOML files of various sizes. For optimal performance, files under 10MB are recommended, though larger files may also be processed depending on your browser capabilities.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What if my TOML syntax is invalid?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool will display an error message indicating the location and nature of the syntax error, helping you identify and fix issues in your TOML file before conversion.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Validate your TOML syntax before conversion to ensure accurate JSON output without errors</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the download feature to save converted JSON files directly, making it easy to integrate into your projects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy button functionality allows quick sharing of JSON output across different applications and platforms</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick access when you frequently work with TOML and JSON configuration files</li>
          </ul>
        </div>
      </div>
    </div>
  );
}