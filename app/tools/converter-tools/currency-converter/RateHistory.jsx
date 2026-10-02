'use client';
// P25 (03/10, E7): history and chart of the exchange rate, as xe.com and Wise show it (ranges, high / low / average /
// change). Data: Frankfurter v2 (frankfurter.dev — free, commercial use allowed, no key, CORS open), which publishes the
// daily reference rates of central banks (the ECB first) back to 1948 for 165 currencies. ExchangeRate-API (the live
// rate above) gives history only on its paid plan. Some of our currencies have no history there: the page says so.
import { useEffect, useMemo, useRef, useState } from 'react';
import { TextDownload } from '../../../components/FileDownload';

const API = 'https://api.frankfurter.dev/v2';
// xe.com: 1W 1M 1Y 2Y 5Y 10Y ; Wise: 1W 1M 6M 1Y 5Y. Long ranges are downsampled by the API itself (group).
const RANGES = [
  { id: '1W', days: 7 }, { id: '1M', days: 31 }, { id: '6M', days: 183 },
  { id: '1Y', days: 366 }, { id: '5Y', days: 5 * 366, group: 'week' }, { id: '10Y', days: 10 * 366, group: 'month' },
];
const iso = (d) => d.toISOString().slice(0, 10);
const fmt = (r) => (Number.isFinite(r) ? new Intl.NumberFormat(undefined, { maximumSignificantDigits: 6 }).format(r) : '—');
const fmtDate = (s) => new Date(`${s}T00:00:00Z`).toLocaleDateString(undefined, { timeZone: 'UTC', dateStyle: 'medium' });

let currenciesPromise = null; // one request per page view, shared by every pair
const loadCurrencies = () => {
  currenciesPromise ||= fetch(`${API}/currencies`).then((r) => {
    if (!r.ok) throw new Error('list');
    return r.json();
  }).then((list) => Object.fromEntries(list.map((c) => [c.iso_code, c]))).catch((e) => { currenciesPromise = null; throw e; });
  return currenciesPromise;
};

export default function RateHistory({ from, to }) {
  const [range, setRange] = useState('1M');
  const [state, setState] = useState({ status: 'idle' });
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (from === to) { setState({ status: 'same' }); return undefined; }
    let cancelled = false;
    const ctl = new AbortController();
    const r = RANGES.find((x) => x.id === range);
    setState({ status: 'loading' });
    setHover(null);
    (async () => {
      let known;
      try { known = await loadCurrencies(); } catch { if (!cancelled) setState({ status: 'error' }); return; }
      const missing = [from, to].filter((c) => !known[c]);
      if (missing.length) { if (!cancelled) setState({ status: 'unavailable', missing }); return; }
      const start = new Date(Date.now() - r.days * 86400000);
      const since = [known[from].start_date, known[to].start_date].sort().pop();
      const fromDate = iso(start) < since ? since : iso(start);
      const url = `${API}/rates?base=${from}&quotes=${to}&from=${fromDate}${r.group ? `&group=${r.group}` : ''}`;
      try {
        const res = await fetch(url, { signal: ctl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const rows = (await res.json()).filter((x) => x.quote === to && Number.isFinite(x.rate) && x.rate > 0);
        if (cancelled) return;
        if (rows.length < 2) { setState({ status: 'unavailable', missing: [] }); return; }
        setState({ status: 'ok', rows, since: iso(start) < since ? since : null });
      } catch (e) {
        if (!cancelled && e.name !== 'AbortError') setState({ status: 'error' });
      }
    })();
    return () => { cancelled = true; ctl.abort(); };
  }, [from, to, range]);

  const W = 640, H = 220, PAD = { l: 8, r: 8, t: 12, b: 22 };
  const chart = useMemo(() => {
    if (state.status !== 'ok') return null;
    const { rows } = state;
    const vals = rows.map((x) => x.rate);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const span = hi - lo || hi * 0.01 || 1;
    const x = (i) => PAD.l + (i / (rows.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v) => PAD.t + (1 - (v - (lo - span * 0.08)) / (span * 1.16)) * (H - PAD.t - PAD.b);
    const d = rows.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.rate).toFixed(1)}`).join('');
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const first = vals[0], last = vals[vals.length - 1];
    return { d, x, y, lo, hi, avg, change: ((last - first) / first) * 100, first: rows[0], last: rows[rows.length - 1], loAt: rows[vals.indexOf(lo)], hiAt: rows[vals.indexOf(hi)] };
  }, [state]);

  const onMove = (e) => {
    if (!chart || !svgRef.current) return;
    const box = svgRef.current.getBoundingClientRect();
    const px = ((e.touches ? e.touches[0].clientX : e.clientX) - box.left) / box.width * W;
    const n = state.rows.length;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1))));
    setHover(i);
  };

  const csv = useMemo(() => (state.status === 'ok' ? `date,${from}/${to}\n${state.rows.map((x) => `${x.date},${x.rate}`).join('\n')}\n` : ''), [state, from, to]);

  return (
    <section className="space-y-3" data-history={state.status} aria-label="Rate history">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold dark:text-white">{from}/{to} rate history</h2>
        <div className="flex gap-1" role="radiogroup" aria-label="Period">
          {RANGES.map((r) => (
            <button key={r.id} type="button" role="radio" aria-checked={range === r.id} onClick={() => setRange(r.id)}
              className={`px-2 py-1 rounded text-sm font-semibold ${range === r.id ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 dark:text-white'}`}>{r.id}</button>
          ))}
        </div>
      </div>
      <div className="min-h-[15rem]">
        {state.status === 'loading' && <p className="text-sm text-neutral-500 dark:text-neutral-400 py-20 text-center">Loading history…</p>}
        {state.status === 'same' && <p className="text-sm text-neutral-500 dark:text-neutral-400 py-20 text-center">Choose two different currencies to see their rate history.</p>}
        {state.status === 'error' && <p className="text-sm text-yellow-700 py-20 text-center">The rate history could not be loaded. Check your connection, then choose the period again.</p>}
        {state.status === 'unavailable' && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 py-16 text-center" data-unavailable>
            No rate history is published for {state.missing.length ? state.missing.join(' and ') : `${from}/${to} over this period`}
            {state.missing.length ? ' by the central-bank sources this chart uses' : ''}. The conversion above still works.
          </p>
        )}
        {state.status === 'ok' && chart && (
          <>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none select-none" role="img"
              aria-label={`${from} to ${to} from ${chart.first.date} to ${chart.last.date}: low ${fmt(chart.lo)}, high ${fmt(chart.hi)}`}
              onMouseMove={onMove} onTouchStart={onMove} onTouchMove={onMove} onMouseLeave={() => setHover(null)}>
              <line x1={PAD.l} x2={W - PAD.r} y1={chart.y(chart.avg)} y2={chart.y(chart.avg)} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" className="text-neutral-500" />
              <path d={chart.d} fill="none" stroke="#6366f1" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              <text x={PAD.l} y={H - 6} fontSize="12" className="fill-neutral-500">{fmtDate(chart.first.date)}</text>
              <text x={W - PAD.r} y={H - 6} fontSize="12" textAnchor="end" className="fill-neutral-500">{fmtDate(chart.last.date)}</text>
              {hover !== null && (() => {
                const p = state.rows[hover]; const cx = chart.x(hover); const cy = chart.y(p.rate);
                const right = cx > W / 2;
                return (
                  <g>
                    <line x1={cx} x2={cx} y1={PAD.t} y2={H - PAD.b} stroke="#6366f1" strokeOpacity="0.4" />
                    <circle cx={cx} cy={cy} r="4" fill="#6366f1" />
                    <text x={right ? cx - 8 : cx + 8} y={PAD.t + 12} fontSize="13" textAnchor={right ? 'end' : 'start'} className="fill-neutral-700 dark:fill-neutral-200" data-hover>{fmtDate(p.date)}: {fmt(p.rate)}</text>
                  </g>
                );
              })()}
            </svg>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mt-2" data-stats>
              <div><dt className="text-neutral-500 dark:text-neutral-400">High</dt><dd className="font-mono dark:text-white" data-high>{fmt(chart.hi)}</dd></div>
              <div><dt className="text-neutral-500 dark:text-neutral-400">Low</dt><dd className="font-mono dark:text-white" data-low>{fmt(chart.lo)}</dd></div>
              <div><dt className="text-neutral-500 dark:text-neutral-400">Average</dt><dd className="font-mono dark:text-white">{fmt(chart.avg)}</dd></div>
              <div><dt className="text-neutral-500 dark:text-neutral-400">Change</dt><dd className={`font-mono ${chart.change >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`} data-change>{chart.change >= 0 ? '+' : ''}{chart.change.toFixed(2)} %</dd></div>
            </dl>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              1 {from} in {to}, {state.rows.length} {RANGES.find((r) => r.id === range).group ? `${RANGES.find((r) => r.id === range).group}ly` : 'daily'} reference rates of central banks
              {state.since ? ` (published since ${fmtDate(state.since)})` : ''}, not intraday quotes — they can differ slightly from the live rate above.
              {' '}Source: <a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer" className="underline">Frankfurter</a>.
            </p>
            <TextDownload text={csv} name={`${from}-${to}-${range}.csv`} type="text/csv;charset=utf-8" className="mt-2" />
          </>
        )}
      </div>
    </section>
  );
}
