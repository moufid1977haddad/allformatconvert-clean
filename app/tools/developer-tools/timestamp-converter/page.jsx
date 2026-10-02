'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseTimestamp, describe, toZoneValue, parseInZone, describeZone, relativeTime } from '../../../lib/timestamp';

// P24 (03/10): a time zone of the visitor's choice for both directions (epochconverter.com), and the relative time.
// The visitor's own zone also goes through parseInZone: an hour skipped by daylight saving time is refused instead of
// being moved on silently as new Date(y, m, d, h) did.
// Chromium lists the old ICU names (Asia/Calcutta, Europe/Kiev): shown under today's IANA names, which every browser accepts
const MODERN = { 'Asia/Calcutta': 'Asia/Kolkata', 'Asia/Katmandu': 'Asia/Kathmandu', 'Asia/Saigon': 'Asia/Ho_Chi_Minh', 'Asia/Rangoon': 'Asia/Yangon', 'Europe/Kiev': 'Europe/Kyiv', 'Atlantic/Faeroe': 'Atlantic/Faroe', 'Pacific/Truk': 'Pacific/Chuuk', 'Pacific/Ponape': 'Pacific/Pohnpei', 'Pacific/Enderbury': 'Pacific/Kanton', 'America/Godthab': 'America/Nuuk', 'Asia/Ulan_Bator': 'Asia/Ulaanbaatar', 'Asia/Dacca': 'Asia/Dhaka', 'Asia/Thimbu': 'Asia/Thimphu', 'Asia/Ujung_Pandang': 'Asia/Makassar', 'America/Buenos_Aires': 'America/Argentina/Buenos_Aires', 'America/Indianapolis': 'America/Indiana/Indianapolis', 'America/Louisville': 'America/Kentucky/Louisville', 'Africa/Asmera': 'Africa/Asmara' };
const modern = (z) => { const m = MODERN[z]; if (!m) return z; try { new Intl.DateTimeFormat('en', { timeZone: m }); return m; } catch { return z; } }; // an older browser keeps the name it knows
const LOCAL_TZ = modern(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
const ZONES = (() => { try { return [...new Set(Intl.supportedValuesOf('timeZone').map(modern))].sort(); } catch { return []; } })();
export default function TimestampConverterPage() {
  const [timestamp, setTimestamp] = useState('');
  const [date, setDate] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [tz, setTz] = useState(LOCAL_TZ);
  const [lastMs, setLastMs] = useState(null);
  const show = (ms, unit, ambiguous = false, gapMinutes = 0, zone = tz) => { setLastMs(ms); setResult({ ...describe(ms), unit, zone: describeZone(ms, zone), ago: relativeTime(ms), ambiguous, gapMinutes }); setError(''); };
  // a date before year 1 cannot go into <input type=datetime-local>: the field is left empty and the result says the year
  const fieldValue = (ms, zone = tz) => { const v = toZoneValue(ms, zone); return v.startsWith('-') || v.startsWith('0000') ? '' : v; };
  const toDate = () => {
    try { const { ms, unit } = parseTimestamp(timestamp); setDate(fieldValue(ms)); show(ms, unit); }
    catch (e) { setResult(null); setError(e.message); }
  };
  const toTimestamp = () => {
    try { const { ms, ambiguous, gapMinutes } = parseInZone(date, tz); setTimestamp(String(Math.floor(ms / 1000))); show(ms, 'seconds', ambiguous, gapMinutes); }
    catch (e) { setResult(null); setError(e.message); }
  };
  const now = () => { const ms = Math.floor(Date.now() / 1000) * 1000; setTimestamp(String(ms / 1000)); setDate(fieldValue(ms)); show(ms, 'seconds'); };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Timestamp Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Unix timestamps to dates</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="ts-zone" className="block text-sm text-neutral-500 mb-1">Time zone (for the date field and the result)</label>
            <select id="ts-zone" value={tz} onChange={(e) => { const z = e.target.value; setTz(z); if (lastMs !== null) { setDate(fieldValue(lastMs, z)); show(lastMs, result?.unit || 'seconds', false, 0, z); } }} /* the same instant, shown in the new zone (review 03/10: the field kept the old wall time) */ className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <option value={LOCAL_TZ}>Your time zone ({LOCAL_TZ})</option>
              {LOCAL_TZ !== 'UTC' && <option value="UTC">UTC</option>}
              {ZONES.filter((z) => z !== LOCAL_TZ && z !== 'UTC').map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <button onClick={now} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Use Current Time</button>
          <div><label className="block text-sm text-neutral-500 mb-1">Unix Timestamp</label><div className="flex gap-2"><input type="text" value={timestamp} onChange={e => setTimestamp(e.target.value)} className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="1234567890" /><button onClick={toDate} className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 font-semibold transition text-white">Convert</button></div></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Date and Time</label><div className="flex gap-2"><input aria-label="Date and Time" type="datetime-local" step="1" value={date} onChange={e => setDate(e.target.value)} className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-lg p-3" /><button onClick={toTimestamp} className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 font-semibold transition text-white">Convert</button></div></div>
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          {result && <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-1 text-sm">
            <div className="text-neutral-500">Read as <strong>{result.unit}</strong></div>
            <div><span className="text-neutral-500">UTC: </span><span className="font-mono">{result.iso}</span></div>
            <div><span className="text-neutral-500">{tz === LOCAL_TZ ? 'Your time zone' : tz.replace(/_/g, ' ')}: </span><span data-zone>{result.zone}</span></div>
            <div><span className="text-neutral-500">Relative: </span><span data-ago>{result.ago}</span></div>
            {result.ambiguous && <div className="text-amber-700">This time happens twice in this zone (clocks go back): the first one was used; the second is {result.gapMinutes === 60 ? 'one hour' : `${result.gapMinutes} minutes`} later.</div>}
            <div><span className="text-neutral-500">Seconds: </span><span className="font-mono">{result.seconds}</span> <span className="text-neutral-500 ml-3">Milliseconds: </span><span className="font-mono">{result.milliseconds}</span></div>
          </div>}
        </div>
      </div>
      <SeoContent
        title={"Timestamp Converter"}
        description={"Timestamp Converter converts a Unix timestamp to a date and back, entirely in your browser — nothing is uploaded to a server. Like epochconverter.com, it recognises the unit from the number of digits — seconds (10 digits today), milliseconds (13, as from JavaScript's Date.now()), microseconds or nanoseconds — and always tells you which one it used. Each result is shown in UTC (ISO 8601) and in your own time zone, with the equivalent seconds and milliseconds. Negative timestamps (before 1970) and fractional seconds are supported; anything that isn't a number is reported instead of being partially read."}
        howTo={[
          "Click 'Use Current Time' to fill in the current Unix timestamp and date, or enter your own.",
          "To convert a timestamp to a date, type it into the Unix Timestamp field and click its 'Convert' button — seconds, milliseconds, microseconds and nanoseconds are all recognised.",
          "To convert a date to a timestamp, pick the time zone (yours by default), set the Date and Time field and click its 'Convert' button.",
          "Read the UTC and local results in the summary box below."
        ]}
        faqs={[
          { q: "Is Timestamp Converter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What is a Unix timestamp?", a: "The number of seconds elapsed since January 1, 1970, 00:00:00 UTC — a common way computers represent a point in time." },
          { q: "Does it support millisecond timestamps?", a: "Yes — a 13-digit value such as 1700000000000 is read as milliseconds, and the result says so. Microseconds (16 digits) and nanoseconds (19 digits) are recognised too." },
          { q: "Which time zone are the dates in?", a: "Every result is shown in UTC (ISO 8601) and in the time zone you pick — yours by default, or any of the IANA zones (Europe/Paris, America/New_York, Asia/Kolkata…). The Date and Time field is read in that zone too; an hour skipped when daylight saving time starts is refused, and one that happens twice when it ends is flagged." },
          { q: "Does it handle dates before 1970?", a: "Yes — enter a negative timestamp, such as -86400 for December 31, 1969." }
        ]}
        tips={[
          "The detected unit is always displayed, so an unexpected year points to a unit mismatch immediately.",
          "Fractional seconds such as 1700000000.5 (Python's time.time()) are accepted.",
          "Use 'Use Current Time' as a quick way to get the current Unix timestamp for testing."
        ]}
      />
    </div>
  );
}