'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

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

export default function UnitConverterPage() {
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

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <style>{`input[type=number]::-webkit-inner-spin-button { -webkit-appearance: inner-spin-button; opacity: 1; background: transparent; cursor: pointer; } input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; } .dark input[type=number]::-webkit-inner-spin-button { filter: invert(1); }`}</style>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Unit Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert length, weight, temperature and more</p>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">

          {/* Category buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.keys(CONVERSIONS).map(cat => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                  category === cat ? 'bg-indigo-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Value input */}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Value</label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(parseFloat(e.target.value) || 0)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xl font-bold text-neutral-800 focus:outline-none"
            />
          </div>

          {/* From / To selects */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">From</label>
              <select value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-800 focus:outline-none">
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">To</label>
              <select value={to} onChange={e => setTo(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-800 focus:outline-none">
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Result */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 rounded-xl p-6 text-center">
            <div className="text-4xl font-extrabold text-indigo-500">{convert()} {to}</div>
            <div className="text-neutral-500 mt-2">{value} {from} = {convert()} {to}</div>
          </div>

        </div>
      </div>
      <SeoContent
        title="Unit Converter"
        description="Unit Converter converts between units across six categories — Length, Weight, Temperature, Speed, Area, and Volume — entirely in your browser, with results updating instantly as you type."
        howTo={[
          "Click a category button (Length, Weight, Temperature, Speed, Area, or Volume) to select what you're converting.",
          "Enter the value you want to convert.",
          "Choose your source unit in the \"From\" dropdown and your target unit in the \"To\" dropdown.",
          "Read the converted result, updated instantly below."
        ]}
        faqs={[
          { q: "Is Unit Converter free to use?", a: "Yes, it's completely free with no signup and no limits." },
          { q: "What categories are supported?", a: "Length, Weight, Temperature, Speed, Area, and Volume — pressure, energy, and power aren't currently included." },
          { q: "How accurate are the results?", a: "Conversions use standard formulas and are shown to 4 decimal places." },
          { q: "Is my data private?", a: "Yes, everything is calculated locally in your browser — nothing is sent to a server." }
        ]}
        tips={[
          "Switch categories using the buttons at the top — your \"From\" and \"To\" units reset to that category's first two units.",
          "For temperature, remember the conversion isn't a simple multiplier like the other categories, since Celsius, Fahrenheit, and Kelvin use different zero points.",
          "Use decimal values in the input field for more precise conversions.",
          "Bookmark this page for quick access to conversions you use often in cooking, DIY, or technical work."
        ]}
      />
    </div>
  );
}