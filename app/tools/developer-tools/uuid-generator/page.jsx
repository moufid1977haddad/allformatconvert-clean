'use client';
import { useState } from 'react';
export default function UuidGeneratorPage() {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(1);
  const generate = () => {
    const newUuids = Array.from({length: count}, () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); }));
    setUuids(newUuids);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">UUID Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate unique UUIDs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Count</label><input type="number" min="1" max="20" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate</button>
          {uuids.length > 0 && <div className="space-y-2">{uuids.map((u,i) => <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="font-mono text-sm">{u}</span><button onClick={() => navigator.clipboard.writeText(u)} className="text-xs text-neutral-500 hover:text-white ml-2">Copy</button></div>)}</div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Uuid Generator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">UUID Generator is a free online tool that creates universally unique identifiers (UUIDs) instantly with no registration required. Generate single or multiple UUIDs in various formats for your development, database, and application needs.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Uuid Generator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the UUID Generator tool on our website</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Generate' button to create a new UUID</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Select your preferred UUID version and format from the available options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the generated UUID to your clipboard and use it in your project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is a UUID and why do I need one?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">A UUID (Universally Unique Identifier) is a 128-bit number used to identify information uniquely. UUIDs are essential for databases, APIs, distributed systems, and any application requiring unique identifiers without centralized coordination.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the UUID Generator tool free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the UUID Generator is completely free with no hidden charges, registration requirements, or usage limits. You can generate as many UUIDs as you need.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What UUID versions does this tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our tool supports UUID versions 1, 3, 4, and 5. Version 4 (random) is the most commonly used, while other versions serve specific purposes like timestamp-based or namespace-based generation.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I generate multiple UUIDs at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can specify the number of UUIDs you want to generate and our tool will create them all at once, allowing you to copy them individually or as a batch.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use UUID v4 for most applications as it generates random, collision-resistant identifiers suitable for databases and distributed systems</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy UUIDs immediately after generation or save them to a file to prevent losing them, as new generations will overwrite previous results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>UUID v1 is useful when you need timestamp information embedded in the identifier, tracking when the UUID was created</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always validate that your application correctly handles UUID formats (with or without hyphens) by testing the generated UUIDs before deploying to production</li>
          </ul>
        </div>
      </div>
    </div>
  );
}