'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
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
      <SeoContent
        title="Timestamp Converter"
        description="Timestamp Converter converts a Unix timestamp (in seconds) to a date and back, entirely in your browser — nothing is uploaded to a server. There's no timezone selector; dates always display in your browser's local timezone via toLocaleString(). It expects timestamps in seconds, not milliseconds — paste a 13-digit millisecond timestamp and it will be misinterpreted as a date thousands of years in the future."
        howTo={[
          "Click 'Use Current Time' to fill in the current Unix timestamp and date, or enter your own.",
          "To convert a timestamp to a date, type it into the Unix Timestamp field and click its 'Convert' button.",
          "To convert a date to a timestamp, set the Date and Time field and click its 'Convert' button.",
          "Read the resulting pair shown in the summary box below."
        ]}
        faqs={[
          { q: "What is a Unix timestamp?", a: "The number of seconds elapsed since January 1, 1970, 00:00:00 UTC — a common way computers represent a point in time." },
          { q: "Can I select a specific timezone for the conversion?", a: "No — there's no timezone dropdown. Dates are always shown in your browser's local timezone." },
          { q: "Does it support millisecond timestamps?", a: "No — timestamps are interpreted as seconds. A 13-digit millisecond timestamp (common in JavaScript's Date.now()) will convert to an incorrect, far-future date unless you divide it by 1000 first." },
          { q: "Is my data uploaded to a server?", a: "No, all conversion happens locally in your browser." }
        ]}
        tips={[
          "If you have a millisecond timestamp (13 digits), divide it by 1000 before pasting it in, since this tool expects seconds (10 digits).",
          "Results reflect your browser's local timezone, not UTC — account for that when comparing timestamps across locations.",
          "After converting a timestamp to a date, the date/time input field may not visually update correctly — rely on the summary box below for the accurate result.",
          "Use 'Use Current Time' as a quick way to get the current Unix timestamp for testing."
        ]}
      />
    </div>
  );
}