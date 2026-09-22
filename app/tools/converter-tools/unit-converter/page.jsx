'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatSignificant } from '../../../lib/exactNumbers';

// Units per ONE base unit, from the exact definitions (1 in = 0.0254 m, 1 lb = 0.45359237 kg,
// 1 US gal = 3.785411784 L, 1 knot = 1.852 km/h...). The previous rounded factors (ft 3.28084,
// inch 39.3701...) showed 1 km = "39370.1000" inch for a true 39370.0787 (measured 2026-09-22).
const CONVERSIONS = {
  Length: { m: 1, km: 0.001, cm: 100, mm: 1000, ft: 1 / 0.3048, inch: 1 / 0.0254, mile: 1 / 1609.344, yard: 1 / 0.9144 },
  Weight: { kg: 1, g: 1000, mg: 1000000, lb: 1 / 0.45359237, oz: 16 / 0.45359237, 'metric ton': 0.001 },
  Temperature: { C: 'special', F: 'special', K: 'special' },
  Speed: { 'km/h': 1, 'mph': 1 / 1.609344, 'm/s': 1 / 3.6, knot: 1 / 1.852 },
  Area: { 'm²': 1, 'km²': 0.000001, 'cm²': 10000, 'ft²': 1 / 0.09290304, 'acre': 1 / 4046.8564224 },
  Volume: { L: 1, mL: 1000, 'm³': 0.001, 'US gallon': 1 / 3.785411784, 'US fl oz': 1000 / 29.5735295625 },
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
    // Significant digits, never toFixed(4): 1 mm used to read "0.0000" mile.
    if (category === 'Temperature') return formatSignificant(convertTemp(value, from, to));
    const base = value / CONVERSIONS[category][from];
    return formatSignificant(base * CONVERSIONS[category][to]);
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