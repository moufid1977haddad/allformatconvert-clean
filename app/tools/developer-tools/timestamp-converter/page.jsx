'use client';
import { useState } from 'react';
export default function TimestampConverterPage() {
  const [timestamp, setTimestamp] = useState('');
  const [date, setDate] = useState('');
  const toDate = () => { const d = new Date(parseInt(timestamp) * 1000); setDate(d.toLocaleString()); };
  const toTimestamp = () => { const d = new Date(date); setTimestamp(Math.floor(d.getTime() / 1000).toString()); };
  const now = () => { const t = Math.floor(Date.now() / 1000); setTimestamp(t.toString()); setDate(new Date(t * 1000).toLocaleString()); };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Timestamp Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Unix timestamps to dates</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <button onClick={now} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Use Current Time</button>
          <div><label className="block text-sm text-neutral-500 mb-1">Unix Timestamp</label><div className="flex gap-2"><input type="text" value={timestamp} onChange={e => setTimestamp(e.target.value)} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="1234567890" /><button onClick={toDate} className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 font-semibold transition">Convert</button></div></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Date and Time</label><div className="flex gap-2"><input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-3" /><button onClick={toTimestamp} className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 font-semibold transition">Convert</button></div></div>
          {timestamp && date && <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-indigo-400 font-mono">{timestamp}</div><div className="text-neutral-400 text-sm mt-1">{date}</div></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Timestamp Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Timestamp Converter is a free online tool that instantly converts Unix timestamps to human-readable dates and times, and vice versa. Perfect for developers, system administrators, and anyone working with time-based data across different formats and time zones.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Timestamp Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your Unix timestamp (in seconds or milliseconds) in the input field or paste your date and time</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your preferred timezone from the dropdown menu to ensure accurate conversion</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the Convert button to instantly see the results in both formats</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the converted timestamp or date to your clipboard using the copy button for easy sharing</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is a Unix timestamp?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">A Unix timestamp is the number of seconds (or milliseconds) that have elapsed since January 1, 1970, at 00:00:00 UTC. It's a standard way computers represent time.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert dates from different time zones?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, our Timestamp Converter supports multiple time zones. Simply select your desired timezone from the dropdown menu before converting.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does this tool work offline?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Timestamp Converter works entirely in your browser, so it functions smoothly whether you're online or offline after the initial page load.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all conversions happen locally in your browser. We don't store, transmit, or log any of your timestamp or date data.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use millisecond timestamps for higher precision when dealing with modern applications and APIs that require sub-second accuracy</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick access during development work, as timestamp conversion is a frequent task in programming</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remember that Unix timestamps are always in UTC, so convert to your local timezone to avoid scheduling errors</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check your timestamp's length: 10 digits typically means seconds, while 13 digits usually indicates milliseconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}