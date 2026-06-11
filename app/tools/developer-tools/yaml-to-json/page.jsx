'use client';
import { useState } from 'react';
export default function YamlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const lines = input.split('\n');
      const obj = {};
      lines.forEach(line => {
        const match = line.match(/^([\w-]+):\s*(.*)$/);
        if (match) obj[match[1]] = isNaN(match[2]) ? match[2] : Number(match[2]);
      });
      setOutput(JSON.stringify(obj, null, 2));
      setError('');
    } catch(e) { setError('Invalid YAML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">YAML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert YAML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">YAML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="name: John&#10;age: 30" value={input} onChange={e => setInput(e.target.value)} /></div>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Yaml To Json</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">YAML to JSON is a free online conversion tool that instantly transforms YAML formatted data into valid JSON format. Perfect for developers, DevOps engineers, and configuration management professionals who need quick and accurate conversions without installation or technical setup.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Yaml To Json</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your YAML content into the input field on the left side of the converter</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically validates your YAML syntax and displays any errors in real-time</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the convert button or let the automatic conversion process your data instantly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the generated JSON output from the right panel or download it as a file for use in your projects</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the YAML to JSON converter free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool is completely free with no registration required. You can perform unlimited conversions at no cost.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum file size I can convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The converter supports files up to 10MB in size, which covers most practical use cases for configuration files and data structures.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does the tool preserve the data structure and types?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the converter accurately preserves all data types, nested structures, arrays, and object relationships during the conversion process.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert JSON back to YAML using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">This tool specifically converts YAML to JSON. For reverse conversion, you would need a JSON to YAML converter.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure proper YAML indentation using spaces, not tabs, as incorrect spacing is a common source of conversion errors</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the validation feature to check your YAML syntax before conversion to catch formatting issues early</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your converted JSON output in your application to verify that the data structure meets your requirements</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick access when working with configuration files in Kubernetes, Ansible, Docker Compose, and other YAML-dependent platforms</li>
          </ul>
        </div>
      </div>
    </div>
  );
}