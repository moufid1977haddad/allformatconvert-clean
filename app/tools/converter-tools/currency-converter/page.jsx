'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';

const CURRENCIES = ['USD','EUR','CAD','GBP','JPY','AUD','CHF','CNY','INR','BRL','MXN','ZAR','SEK','NOK','DKK','SGD','HKD','NZD','KRW','TRY','SAR','AED','MAD','TND'];

export default function CurrencyConverterPage() {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => { loadRates(); }, []);

  const loadRates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setRates(data.rates);
      setLastUpdate(new Date().toLocaleString());
    } catch (err) {
      setError('Could not load rates. Check your connection.');
    }
    setLoading(false);
  };

  const convert = () => {
    if (!rates || !amount) return '—';
    const amountInUSD = from === 'USD' ? amount : amount / rates[from];
    const result = to === 'USD' ? amountInUSD : amountInUSD * rates[to];
    return result.toFixed(4);
  };

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
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex justify-center items-center">
              <button onClick={swap} style={{background:'#6366f1', color:'#fff', borderRadius:'50%', width:'40px', height:'40px', border:'none', cursor:'pointer', fontSize:'18px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center'}}>⇄</button>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">To</label>
              <select value={to} onChange={e => setTo(e.target.value)} className="w-full bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg p-3 dark:text-white">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {loading && <p className="text-center text-neutral-500 dark:text-neutral-400">Loading rates...</p>}
          {error && <p className="text-center text-yellow-400 text-sm">{error}</p>}
          {rates && !loading && (
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <div className="text-4xl font-bold text-indigo-400">{convert()} {to}</div>
              <div className="text-neutral-500 dark:text-neutral-400 mt-2">{amount} {from} = {convert()} {to}</div>
              <div className="text-neutral-400 text-xs mt-3">Updated: {lastUpdate}</div>
            </div>
          )}
          <button onClick={loadRates} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 font-semibold transition">Refresh Rates</button>
        </div>
      </div>
      <SeoContent
        title="Currency Converter"
        description="Currency Converter converts between 24 major world currencies using exchange rates fetched directly in your browser from a free public API (exchangerate-api.com). Rates from this free tier are typically refreshed about once a day, not continuously in real time."
        howTo={[
          "Enter the amount you want to convert.",
          "Select your source currency from the \"From\" dropdown.",
          "Select your target currency from the \"To\" dropdown, or use the swap button (⇄) to flip both.",
          "The converted amount appears instantly; click \"Refresh Rates\" to fetch the latest available rates."
        ]}
        faqs={[
          { q: "Is Currency Converter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How often are the exchange rates updated?", a: "Rates come from a free public exchange-rate API that's typically refreshed roughly once a day — not continuously throughout the day." },
          { q: "Which currencies are supported?", a: "24 major currencies, including USD, EUR, GBP, JPY, CAD, and AUD — see the dropdown for the full list." },
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