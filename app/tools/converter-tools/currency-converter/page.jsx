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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Currency Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Currency Converter is a free online tool that instantly converts between multiple world currencies with real-time exchange rates. Get accurate currency conversions for travel, business, or personal finance needs without any hidden fees or subscriptions.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Currency Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter the amount you want to convert in the input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your source currency from the dropdown menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose your target currency for conversion</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>View the converted amount instantly displayed on your screen</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Currency Converter really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Currency Converter is completely free with no hidden charges, registration requirements, or premium subscriptions needed to access full functionality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How often are the exchange rates updated?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Exchange rates are updated in real-time throughout the day, ensuring you always get the most current conversion rates for accurate transactions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple currencies at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can perform multiple conversions sequentially by simply changing the currency selections and amounts for each new conversion.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which currencies does the tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Currency Converter supports all major world currencies including USD, EUR, GBP, JPY, CAD, AUD, and many others for comprehensive global coverage.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark the tool for quick access during travel or when making international purchases online</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check exchange rates during off-peak market hours for potentially more favorable conversion rates</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the converter to compare prices when shopping on international websites</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep historical conversion rates in mind, as rates fluctuate daily based on market conditions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}