'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';

// Rates: ExchangeRate-API's documented no-key "Open Access" endpoint (v6) -- 166 currencies, refreshed daily,
// commercial use allowed, attribution required (link below the result). Chosen 2026-09-23 after checking the
// alternatives live (docs/audit/RAPPORT-licence-et-ameliorations.md §5): the old v4 URL has no terms or docs
// any more; Frankfurter (ECB) has 29 currencies and answers with a Deprecation header on v1.
const RATES_URL = 'https://open.er-api.com/v6/latest/USD';
// The most used currencies first in the lists, then every other one alphabetically.
const POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL', 'KRW', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'ZAR', 'TRY', 'AED'];
let names = null;
try { names = new Intl.DisplayNames(['en'], { type: 'currency' }); } catch { /* older browsers: codes only */ }
const currencyName = (code) => { const n = names?.of(code); return n && n !== code ? n : ''; };
const label = (code) => (currencyName(code) ? `${code} — ${currencyName(code)}` : code);

// Amount in a currency's own style (JPY without decimals, thousands separators); small values keep 4
// significant digits instead of rounding to 0.00.
function formatMoney(value, code) {
  if (!Number.isFinite(value)) return '—';
  let digits = 2;
  try { digits = new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits; } catch { /* unknown code */ }
  const abs = Math.abs(value);
  const max = abs !== 0 && abs < 1 ? Math.max(digits, 1 - Math.floor(Math.log10(abs)) + 2) : digits;
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: Math.min(digits, max), maximumFractionDigits: Math.min(max, 12) }).format(value);
}
const formatRate = (r) => (Number.isFinite(r) ? new Intl.NumberFormat(undefined, { maximumSignificantDigits: 6 }).format(r) : '—');

export default function CurrencyConverterPage() {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [nextUpdate, setNextUpdate] = useState('');

  useEffect(() => { loadRates(); }, []);

  const loadRates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(RATES_URL);
      if (res.status === 429) throw new Error('The exchange-rate service is busy. Please try again in a few minutes.');
      if (!res.ok) throw new Error('Could not load rates. Check your connection.');
      const data = await res.json();
      if (data.result !== 'success' || !data.rates || typeof data.rates.EUR !== 'number') throw new Error('The exchange-rate service sent no usable rates. Please try again later.');
      setRates(data.rates);
      // The date the RATES were published (the API's own timestamp), not the time this page
      // fetched them: it used to show the current time for rates up to a day old (measured 2026-09-22).
      const when = (unix) => new Date(unix * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      setLastUpdate(data.time_last_update_unix ? when(data.time_last_update_unix) : 'unknown');
      setNextUpdate(data.time_next_update_unix ? when(data.time_next_update_unix) : '');
    } catch (err) {
      setRates(null);
      setError(err.message || 'Could not load rates. Check your connection.');
    }
    setLoading(false);
  };

  // Every rate is quoted against USD: cross rate = rate[to] / rate[from].
  const unitRate = rates && rates[from] && rates[to] ? rates[to] / rates[from] : NaN;
  const result = Number.isFinite(amount) ? amount * unitRate : NaN;
  const codes = rates ? [...POPULAR.filter((c) => c in rates), ...Object.keys(rates).filter((c) => !POPULAR.includes(c)).sort()] : POPULAR;

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <style>{`input[type=number]::-webkit-inner-spin-button { opacity: 1; } .dark input[type=number]::-webkit-inner-spin-button { filter: invert(1); }`}</style>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 dark:text-white">Currency Converter</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-8">Convert between world currencies</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg p-3 text-xl font-bold dark:text-white" />
          </div>
          <div className="grid grid-cols-5 gap-2 items-end">
            <div className="col-span-2">
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">From</label>
              <select value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg p-3 dark:text-white">
                {codes.map(c => <option key={c} value={c}>{label(c)}</option>)}
              </select>
            </div>
            <div className="flex justify-center items-center">
              <button onClick={swap} style={{background:'#6366f1', color:'#fff', borderRadius:'50%', width:'40px', height:'40px', border:'none', cursor:'pointer', fontSize:'18px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center'}}>⇄</button>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">To</label>
              <select value={to} onChange={e => setTo(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg p-3 dark:text-white">
                {codes.map(c => <option key={c} value={c}>{label(c)}</option>)}
              </select>
            </div>
          </div>
          {loading && <p className="text-center text-neutral-500 dark:text-neutral-400">Loading rates...</p>}
          {error && <p className="text-center text-yellow-400 text-sm">{error}</p>}
          {rates && !loading && (
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <div className="text-4xl font-bold text-indigo-400 break-words">{formatMoney(result, to)} {to}</div>
              <div className="text-neutral-500 dark:text-neutral-400 mt-2">{formatMoney(amount, from)} {from}{currencyName(from) ? ` (${currencyName(from)})` : ''} = {formatMoney(result, to)} {to}{currencyName(to) ? ` (${currencyName(to)})` : ''}</div>
              <div className="text-neutral-500 dark:text-neutral-400 text-sm mt-2">1 {from} = {formatRate(unitRate)} {to} · 1 {to} = {formatRate(1 / unitRate)} {from}</div>
              <div className="text-neutral-400 text-xs mt-3">Rates published: {lastUpdate}{nextUpdate ? ` · next update: ${nextUpdate}` : ''} · <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">Rates By Exchange Rate API</a></div>
            </div>
          )}
          <button onClick={loadRates} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 font-semibold transition">Refresh Rates</button>
        </div>
      </div>
      <SeoContent
        title="Currency Converter"
        description="Currency Converter converts between 166 world currencies, each shown with its full name, using exchange rates fetched directly in your browser from ExchangeRate-API (exchangerate-api.com). The rates are refreshed once a day, not in real time: the result shows when they were published and when the next update is due."
        howTo={[
          "Enter the amount you want to convert.",
          "Select your source currency from the \"From\" dropdown.",
          "Select your target currency from the \"To\" dropdown, or use the swap button (⇄) to flip both.",
          "The converted amount appears instantly; click \"Refresh Rates\" to fetch the latest available rates."
        ]}
        faqs={[
          { q: "Is Currency Converter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How often are the exchange rates updated?", a: "Rates come from a free public exchange-rate API that's typically refreshed roughly once a day — not continuously throughout the day." },
          { q: "Which currencies are supported?", a: "166 currencies — every currency with a published daily rate, from USD, EUR, GBP and JPY to the Moroccan dirham, the Nigerian naira or the Vietnamese dong. The most used ones are listed first, then all the others alphabetically, each with its full name." },
          { q: "Is my data private?", a: "The amount and currency codes you select are sent to a public third-party exchange-rate API to fetch rates; no personal or financial account information is involved." }
        ]}
        tips={[
          "Click \"Refresh Rates\" if you've had the page open a while, to make sure you're using the latest available rates.",
          "Use the swap button (⇄) to quickly flip your \"From\" and \"To\" currencies.",
          "Since rates update roughly daily, don't rely on this tool for time-sensitive trading decisions.",
          "Bookmark the tool for quick reference during travel or online shopping in another currency."
        ]}
      />
    </div>
  );
}