'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseTimestamp, describe, toZoneValue, parseInZone, describeZone, relativeTime } from '../../../lib/timestamp';
import { useToolError } from '../../../lib/useToolError';

// P24 (03/10): a time zone of the visitor's choice for both directions (epochconverter.com), and the relative time.
// The visitor's own zone also goes through parseInZone: an hour skipped by daylight saving time is refused instead of
// being moved on silently as new Date(y, m, d, h) did.
// Chromium lists the old ICU names (Asia/Calcutta, Europe/Kiev): shown under today's IANA names, which every browser accepts
const MODERN = { 'Asia/Calcutta': 'Asia/Kolkata', 'Asia/Katmandu': 'Asia/Kathmandu', 'Asia/Saigon': 'Asia/Ho_Chi_Minh', 'Asia/Rangoon': 'Asia/Yangon', 'Europe/Kiev': 'Europe/Kyiv', 'Atlantic/Faeroe': 'Atlantic/Faroe', 'Pacific/Truk': 'Pacific/Chuuk', 'Pacific/Ponape': 'Pacific/Pohnpei', 'Pacific/Enderbury': 'Pacific/Kanton', 'America/Godthab': 'America/Nuuk', 'Asia/Ulan_Bator': 'Asia/Ulaanbaatar', 'Asia/Dacca': 'Asia/Dhaka', 'Asia/Thimbu': 'Asia/Thimphu', 'Asia/Ujung_Pandang': 'Asia/Makassar', 'America/Buenos_Aires': 'America/Argentina/Buenos_Aires', 'America/Indianapolis': 'America/Indiana/Indianapolis', 'America/Louisville': 'America/Kentucky/Louisville', 'Africa/Asmera': 'Africa/Asmara' };
const modern = (z) => { const m = MODERN[z]; if (!m) return z; try { new Intl.DateTimeFormat('en', { timeZone: m }); return m; } catch { return z; } }; // an older browser keeps the name it knows
// P27: read in the browser after the first render -- the page is built on a server in UTC, so reading it while
// rendering gave the visitor's zone in the browser and UTC in the HTML (React hydration error #418 on every page view
// outside UTC, found by the Firefox and WebKit page benches).
const readLocalTz = () => modern(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
// the zone list differs between the server's Node and each browser's own list (Firefox, Safari): read after the first
// render too, or the menu's options would not match the HTML (React #418)
const readZones = () => { try { return [...new Set(Intl.supportedValuesOf('timeZone').map(modern))].sort(); } catch { return []; } };
export default function TimestampConverterPage() {
  const [timestamp, setTimestamp] = useState('');
  const [date, setDate] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const [LOCAL_TZ, setLocalTz] = useState('UTC');
  const [tz, setTz] = useState('UTC');
  const [ZONES, setZones] = useState([]);
  useEffect(() => { const z = readLocalTz(); setLocalTz(z); setTz((t) => (t === 'UTC' ? z : t)); setZones(readZones()); }, []);
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
        description={"Timestamp Converter turns a Unix timestamp into a date and a date back into a timestamp. The unit is read from the number of digits (up to 11 for seconds, 12 to 14 for milliseconds, 15 to 17 for microseconds, 18 to 20 for nanoseconds), and the result always names the unit it used. Each result gives the ISO 8601 date in UTC, the date in the time zone you pick (your own by default), how long ago or ahead it is, and the value as seconds and as milliseconds. Negative values (before 1970) work, and decimals are read for seconds only. A time skipped by daylight saving time is refused and a repeated one is flagged."}
        example={{
          caption: "Output of the page’s own conversion code for a 13-digit value with America/New_York picked; the Relative line is left out because it depends on today’s date.",
          inputLabel: "Unix Timestamp",
          input: "1700000000000",
          outputLabel: "Result box",
          output: "Read as milliseconds\nUTC: 2023-11-14T22:13:20.000Z\nAmerica/New York: Tuesday, 14 November 2023 at 17:13:20 (UTC−05:00)\nSeconds: 1700000000  Milliseconds: 1700000000000",
        }}
        howToTitle={"How to convert a Unix timestamp to a date and back"}
        howTo={[
          "Pick a zone in \"Time zone (for the date field and the result)\"; your own zone comes first.",
          "Type a timestamp in \"Unix Timestamp\" and click the \"Convert\" button next to it, or click \"Use Current Time\".",
          "To go the other way, set \"Date and Time\" and click its \"Convert\" button.",
          "Read the box below: \"Read as\" names the unit, followed by UTC, your chosen zone, the relative time and the value as seconds and as milliseconds.",
        ]}
        specs={[
          { label: "Units read", value: "Seconds (up to 11 digits), milliseconds (12 to 14), microseconds (15 to 17), nanoseconds (18 to 20)" },
          { label: "Date range", value: "The JavaScript date range, from year -271821 to year 275760" },
          { label: "Precision", value: "Milliseconds; microseconds and nanoseconds are truncated, and a decimal part counts for seconds only" },
          { label: "Time zones", value: "Your browser’s list of IANA zones, shown under their current names such as Asia/Kolkata" },
          { label: "Date to timestamp", value: "Whole seconds, read in the zone you picked" },
        ]}
        privacyTitle={"Where your dates are converted"}
        privacy={"Every conversion is computed by the page with your browser’s own time-zone data; the timestamps and dates you enter are not sent to our servers. If an error message is shown, that message is sent to our error log with the tool’s name and your browser’s name and version, long numbers replaced by a placeholder, so that we can fix recurring problems."}
        faqs={[
          { q: "Can it tell seconds from milliseconds?", a: "Yes, by counting digits: 1700000000 has 10 digits and is read as seconds, 1700000000000 has 13 and is read as milliseconds. The result starts with Read as and the unit, so a date in 1970 or far in the future points to a wrong unit." },
          { q: "Is the date field read in UTC?", a: "No. It is read in the zone selected in the list, which is your own by default. A time skipped when daylight saving time starts is refused with a message, and a time that occurs twice is read as the first one, with a note giving the second." },
          { q: "Can I convert dates before 1970?", a: "Yes. Enter a negative timestamp: -86400 gives 1969-12-31T00:00:00.000Z in UTC. Dates before year 1 are shown in the results, but the date field stays empty because it cannot hold them." },
          { q: "Does it accept decimal timestamps like 1700000000.5?", a: "Yes, for seconds: 1700000000.5, as returned by Python’s time.time(), is read to the millisecond. A decimal part after a millisecond, microsecond or nanosecond value is ignored." },
        ]}
      />
    </div>
  );
}