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
    </div>
  );
}