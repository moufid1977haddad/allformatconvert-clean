'use client';
import { useState, useEffect } from 'react';

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
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Currency Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between world currencies</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xl font-bold" />
          </div>
          <div className="grid grid-cols-5 gap-2 items-end">
            <div className="col-span-2">
              <label className="block text-sm text-neutral-500 mb-1">From</label>
              <select value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex justify-center">
              <button onClick={swap} className="bg-neutral-800 hover:bg-neutral-100 rounded-full p-2 transition">⇄</button>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-neutral-500 mb-1">To</label>
              <select value={to} onChange={e => setTo(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {loading && <p className="text-center text-neutral-500">Loading rates...</p>}
          {error && <p className="text-center text-yellow-400 text-sm">{error}</p>}
          {rates && !loading && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-4xl font-bold text-indigo-400">{convert()} {to}</div>
              <div className="text-neutral-500 mt-2">{amount} {from} = {convert()} {to}</div>
              <div className="text-neutral-500 text-xs mt-3">Updated: {lastUpdate}</div>
            </div>
          )}
          <button onClick={loadRates} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Refresh Rates</button>
        </div>
      </div>
    </div>
  );
}