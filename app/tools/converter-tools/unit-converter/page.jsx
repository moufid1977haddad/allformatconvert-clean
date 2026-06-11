'use client';
import { useState, useEffect } from 'react';

const CONVERSIONS = {
  Length: { m: 1, km: 0.001, cm: 100, mm: 1000, ft: 3.28084, inch: 39.3701, mile: 0.000621371, yard: 1.09361 },
  Weight: { kg: 1, g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274, ton: 0.001 },
  Temperature: { C: 'special', F: 'special', K: 'special' },
  Speed: { 'km/h': 1, 'mph': 0.621371, 'm/s': 0.277778, knot: 0.539957 },
  Area: { 'm²': 1, 'km²': 0.000001, 'cm²': 10000, 'ft²': 10.7639, 'acre': 0.000247105 },
  Volume: { L: 1, mL: 1000, 'm³': 0.001, gallon: 0.264172, 'fl oz': 33.814 },
};

const convertTemp = (value, from, to) => {
  let celsius;
  if (from === 'C') celsius = value;
  else if (from === 'F') celsius = (value - 32) * 5/9;
  else celsius = value - 273.15;
  if (to === 'C') return celsius;
  if (to === 'F') return celsius * 9/5 + 32;
  return celsius + 273.15;
};

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export default function UnitConverterPage() {
  const dark = useDarkMode();
  const [category, setCategory] = useState('Length');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('ft');
  const [value, setValue] = useState(1);

  const units = Object.keys(CONVERSIONS[category]);

  const convert = () => {
    if (category === 'Temperature') return convertTemp(value, from, to).toFixed(4);
    const base = value / CONVERSIONS[category][from];
    return (base * CONVERSIONS[category][to]).toFixed(4);
  };

  const handleCategory = (cat) => {
    setCategory(cat);
    const u = Object.keys(CONVERSIONS[cat]);
    setFrom(u[0]);
    setTo(u[1]);
  };

  const bg = dark ? '#111111' : '#f5f5f5';
  const cardBg = dark ? '#1c1c1e' : '#ffffff';
  const border = dark ? '#2c2c2e' : '#e5e7eb';
  const textMain = dark ? '#ffffff' : '#1f2937';
  const textSub = dark ? '#9ca3af' : '#6b7280';
  const inputBg = dark ? '#2c2c2e' : '#f9fafb';

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '24px' }}>
      <style>{`input[type=number]::-webkit-inner-spin-button { -webkit-appearance: inner-spin-button; opacity: 1; background: transparent; cursor: pointer; } input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; } .dark input[type=number]::-webkit-inner-spin-button { filter: invert(1); }`}</style>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'center', marginBottom: '8px', color: textMain }}>Unit Converter</h1>
        <p style={{ textAlign: 'center', marginBottom: '32px', color: textSub }}>Convert length, weight, temperature and more</p>

        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Category buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {Object.keys(CONVERSIONS).map(cat => (
              <button key={cat} onClick={() => handleCategory(cat)} style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: category === cat ? '#6366f1' : (dark ? '#2c2c2e' : '#e5e7eb'),
                color: category === cat ? '#ffffff' : textMain,
              }}>{cat}</button>
            ))}
          </div>

          {/* Value input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: textSub, marginBottom: '6px' }}>Value</label>
            <input type="number" value={value} onChange={e => setValue(parseFloat(e.target.value) || 0)} style={{
              width: '100%', background: inputBg, border: `1px solid ${border}`,
              borderRadius: '10px', padding: '12px', fontSize: '20px', fontWeight: '700',
              color: textMain, outline: 'none', boxSizing: 'border-box',
            }} />
          </div>

          {/* From / To selects */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: textSub, marginBottom: '6px' }}>From</label>
              <select value={from} onChange={e => setFrom(e.target.value)} style={{
                width: '100%', background: inputBg, border: `1px solid ${border}`,
                borderRadius: '10px', padding: '12px', color: textMain, outline: 'none',
              }}>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: textSub, marginBottom: '6px' }}>To</label>
              <select value={to} onChange={e => setTo(e.target.value)} style={{
                width: '100%', background: inputBg, border: `1px solid ${border}`,
                borderRadius: '10px', padding: '12px', color: textMain, outline: 'none',
              }}>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Result */}
          <div style={{ background: dark ? '#0a0a0a' : '#f9fafb', border: `1px solid ${border}`, borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#6366f1' }}>{convert()} {to}</div>
            <div style={{ color: textSub, marginTop: '8px' }}>{value} {from} = {convert()} {to}</div>
          </div>

        </div>
      </div>
    </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Unit Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Unit Converter tool. No signup required, no watermark, works on all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Why use OnlineConverTools?</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>100% free — no hidden fees</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No signup or account required</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Files processed locally — your data stays private</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Works on all devices — desktop, tablet, mobile</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No watermarks added to your files</li>
          </ul>
        </div>
      </div>

  );
}
