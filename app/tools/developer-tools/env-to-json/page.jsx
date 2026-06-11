'use client';
import { useState } from 'react';
export default function EnvToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toJson = () => {
    const obj = {};
    input.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) return;
      const k = line.slice(0, eqIdx).trim();
      const v = line.slice(eqIdx+1).trim().replace(/^"|"$/g,'').replace(/^'|'$/g,'');
      obj[k] = v;
    });
    setOutput(JSON.stringify(obj, null, 2));
  };
  const toEnv = () => {
    try {
      const obj = JSON.parse(input);
      setOutput(Object.entries(obj).map(([k,v]) => k + '=' + v).join('\n'));
    } catch(e) { setOutput('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">.env to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert .env files to JSON and back</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="KEY=value..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={toJson} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">.env to JSON</button>
            <button onClick={toEnv} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">JSON to .env</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Env To Json</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Env To Json is a free online tool that instantly converts environment variables from .env files into properly formatted JSON objects. Simplify your configuration management and API integration by transforming your environment settings into structured JSON data without any coding required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Env To Json</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your .env file content or individual environment variables into the input field on the Env To Json converter</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically parses KEY=VALUE pairs and formats them into valid JSON structure</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button to generate your JSON output instantly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the resulting JSON code and use it in your application, configuration files, or documentation</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Env To Json completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Env To Json is completely free with no hidden charges, registration requirements, or usage limits for converting your environment variables.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What format should my environment variables be in?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your environment variables should follow the standard format: KEY=VALUE, with each variable on a new line, just like a typical .env file.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple .env files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can paste multiple environment variables from different sources into the tool, and it will convert them all into a single JSON object.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using Env To Json?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all conversions are processed locally in your browser, and no data is stored on our servers, ensuring complete privacy and security.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use descriptive variable names in your .env files to make the resulting JSON more readable and easier to maintain in your projects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove any comments or empty lines from your .env content before conversion for cleaner JSON output without parsing errors</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Validate your JSON output using a JSON validator tool to ensure proper formatting before implementing it in production environments</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep sensitive information like API keys and passwords secure even after conversion, and never commit raw JSON with credentials to version control</li>
          </ul>
        </div>
      </div>
    </div>
  );
}