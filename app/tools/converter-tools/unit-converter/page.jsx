'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatSignificant } from '../../../lib/exactNumbers';

// Units per ONE base unit, from the exact definitions (1 in = 0.0254 m, 1 lb = 0.45359237 kg,
// 1 US gal = 3.785411784 L, 1 knot = 1.852 km/h...). The previous rounded factors (ft 3.28084,
// inch 39.3701...) showed 1 km = "39370.1000" inch for a true 39370.0787 (measured 2026-09-22).
// Time, Data, Pressure, Energy and Power added 2026-09-26 (the "common" categories of unitconverters.net that this
// page lacked). Their factors are definitions too (SI; NIST SP 811 appendix B): psi = 0.45359237 kg x 9.80665 m/s²
// / (0.0254 m)², conventional mmHg = 13.5951 x 9.80665 Pa, torr = 101325/760 Pa, thermochemical calorie = 4.184 J,
// International Table BTU = 1055.05585262 J, eV = 1.602176634e-19 J (exact since 2019), ft·lbf = 0.3048 m x
// 4.4482216152605 N, mechanical horsepower = 550 ft·lbf/s, metric horsepower = 75 kgf·m/s, Gregorian year =
// 365.2425 days (month = year / 12).
const CONVERSIONS = {
  // P24 (03/10): the units unitconverters.net lists that were missing (exact definitions: NIST SP 811)
  Length: { m: 1, km: 0.001, cm: 100, mm: 1000, 'µm': 1e6, nm: 1e9, ft: 1 / 0.3048, inch: 1 / 0.0254, mile: 1 / 1609.344, yard: 1 / 0.9144, 'nautical mile': 1 / 1852 },
  Weight: { kg: 1, g: 1000, mg: 1000000, lb: 1 / 0.45359237, oz: 16 / 0.45359237, 'metric ton': 0.001, stone: 1 / 6.35029318, 'US ton (short)': 1 / 907.18474, 'UK ton (long)': 1 / 1016.0469088, carat: 5000 },
  Temperature: { C: 'special', F: 'special', K: 'special', R: 'special' },
  'Fuel economy': { 'L/100 km': 'special', 'mpg (US)': 'special', 'mpg (UK)': 'special', 'km/L': 'special' },
  Speed: { 'km/h': 1, 'mph': 1 / 1.609344, 'm/s': 1 / 3.6, knot: 1 / 1.852 },
  Area: { 'm²': 1, 'km²': 0.000001, 'cm²': 10000, hectare: 1e-4, 'in²': 1 / 0.00064516, 'ft²': 1 / 0.09290304, 'yd²': 1 / 0.83612736, 'acre': 1 / 4046.8564224, 'mi²': 1 / 2589988.110336 },
  Volume: { L: 1, mL: 1000, 'm³': 0.001, 'cm³': 1000, 'US gallon': 1 / 3.785411784, 'US quart': 1 / 0.946352946, 'US pint': 1 / 0.473176473, 'US cup': 1 / 0.2365882365, 'US fl oz': 1000 / 29.5735295625, tablespoon: 1 / 0.01478676478125, teaspoon: 1 / 0.00492892159375, 'UK gallon': 1 / 4.54609, 'UK pint': 1 / 0.56826125, 'UK fl oz': 1 / 0.0284130625, 'ft³': 1 / 28.316846592, 'in³': 1 / 0.016387064 },
  Time: { s: 1, ms: 1000, 'µs': 1e6, ns: 1e9, min: 1 / 60, h: 1 / 3600, day: 1 / 86400, week: 1 / 604800, 'month (average)': 1 / 2629746, 'year (365.2425 days)': 1 / 31556952 },
  Data: { byte: 1, bit: 8, kB: 1e-3, MB: 1e-6, GB: 1e-9, TB: 1e-12, PB: 1e-15, KiB: 1 / 1024, MiB: 1 / 1024 ** 2, GiB: 1 / 1024 ** 3, TiB: 1 / 1024 ** 4, kbit: 8e-3, Mbit: 8e-6, Gbit: 8e-9 },
  Pressure: { Pa: 1, kPa: 1e-3, MPa: 1e-6, bar: 1e-5, mbar: 1e-2, atm: 1 / 101325, psi: 1 / 6894.757293168361, mmHg: 1 / 133.322387415, inHg: 1 / 3386.388640341, torr: 760 / 101325 },
  Energy: { J: 1, kJ: 1e-3, MJ: 1e-6, Wh: 1 / 3600, kWh: 1 / 3.6e6, cal: 1 / 4.184, kcal: 1 / 4184, BTU: 1 / 1055.05585262, eV: 1 / 1.602176634e-19, 'ft·lbf': 1 / 1.3558179483314004 },
  Power: { W: 1, kW: 1e-3, MW: 1e-6, hp: 1 / 745.69987158227022, 'hp (metric)': 1 / 735.49875, 'BTU/h': 3600 / 1055.05585262, 'kcal/h': 3600 / 4184 },
};

// P24 (03/10): fuel economy, as unitconverters.net has it. L/100 km is the inverse of km/L, so it cannot be a factor:
// everything goes through km/L (US gallon 3.785411784 L, UK gallon 4.54609 L, mile 1.609344 km).
const KM_PER_L = { 'km/L': 1, 'mpg (US)': 1.609344 / 3.785411784, 'mpg (UK)': 1.609344 / 4.54609 };
const convertFuel = (value, from, to) => {
  const kmL = from === 'L/100 km' ? 100 / value : value * KM_PER_L[from];
  return to === 'L/100 km' ? 100 / kmL : kmL / KM_PER_L[to];
};

const convertTemp = (value, from, to) => {
  let celsius;
  if (from === 'C') celsius = value;
  else if (from === 'F') celsius = (value - 32) * 5/9;
  else if (from === 'R') celsius = (value - 491.67) * 5/9; // Rankine: Fahrenheit-sized degrees from absolute zero
  else celsius = value - 273.15;
  if (to === 'C') return celsius;
  if (to === 'F') return celsius * 9/5 + 32;
  if (to === 'R') return (celsius + 273.15) * 9/5;
  return celsius + 273.15;
};

// 12 significant digits (unitconverters.net shows 11, and was closer than our first 10 on 6 of 11 compared
// conversions, 26/09/2026); very large or very small results in scientific notation (1 eV = 4.45049065e-26 kWh).
const show = (v) => (v !== 0 && Number.isFinite(v) && (Math.abs(v) < 1e-6 || Math.abs(v) >= 1e15)
  ? v.toExponential(11).replace(/\.?0+e/, 'e').replace('e+', 'e')
  : formatSignificant(v, 12));

export default function UnitConverterPage() {
  const [category, setCategory] = useState('Length');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('ft');
  // Kept as typed: a number field turned "" or "-" into 0 and showed a result for it.
  const [text, setText] = useState('1');
  // P24 (03/10): "1,000" was read as 1 (the comma made a decimal point): a pasted thousands separator gave a result 1000×
  // too small. Spaces between thousands are ignored; with both "," and "." the last one is the decimal mark; a single
  // comma followed by exactly three digits could mean either, so the page asks instead of guessing.
  const parsed = (() => {
    let t = text.trim().replace(/(\d)[\s\u00a0\u202f]+(?=\d{3}(\D|$))/g, '$1');
    if (/\s/.test(t)) return { value: NaN };
    if (!t) return { value: NaN };
    if (t.includes(',') && t.includes('.')) t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    else if (/^[-+]?[1-9]\d{0,2},\d{3}$/.test(t)) return { value: NaN, ambiguous: t }; // 1,000: a thousand or one? (0,001 is not; a dot is the decimal point on this English page)
    else if (/^[-+]?\d{1,3}(,\d{3}){2,}$/.test(t)) t = t.replace(/,/g, ''); // 1,000,000: thousands
    else if ((t.match(/,/g) || []).length === 1) t = t.replace(',', '.');
    return { value: /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? Number(t) : NaN }; // decimal only: Number('0x10') is 16
  })();
  const value = parsed.value;
  const invalid = !Number.isFinite(value);

  const units = Object.keys(CONVERSIONS[category]);

  // Significant digits, never toFixed(4): 1 mm used to read "0.0000" mile.
  const raw = (v, a, b) => (category === 'Temperature' ? convertTemp(v, a, b) : category === 'Fuel economy' ? convertFuel(v, a, b) : (v / CONVERSIONS[category][a]) * CONVERSIONS[category][b]);
  const fuelBad = category === 'Fuel economy' && !invalid && !(value > 0); // 0 L/100 km or 0 mpg has no inverse
  const convert = () => (invalid || fuelBad ? '—' : show(raw(value, from, to)));
  const belowZero = category === 'Temperature' && !invalid && convertTemp(value, from, 'K') < -1e-9;

  const handleCategory = (cat) => {
    setCategory(cat);
    const u = Object.keys(CONVERSIONS[cat]);
    setFrom(u[0]);
    setTo(u[1]);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Unit Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert length, weight, temperature, time, data, pressure, energy and more</p>

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
            <label htmlFor="uc-value" className="block text-sm text-neutral-500 mb-1">Value</label>
            <input
              id="uc-value"
              type="text"
              inputMode="decimal"
              value={text}
              onChange={e => setText(e.target.value)}
              aria-invalid={invalid}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xl font-bold text-neutral-800 focus:outline-none"
            />
            {invalid && <p className="text-sm text-red-600 mt-1" role="alert">Type a number, e.g. 12.5, -40 or 6.02e23.</p>}
            {fuelBad && <p className="text-sm text-amber-700 mt-1" role="alert">Fuel economy must be more than 0: 0 L/100 km or 0 mpg has no equivalent in the other units.</p>}
            {belowZero && <p className="text-sm text-amber-700 mt-1" role="alert">That is below absolute zero (0 K = -273.15 °C = -459.67 °F).</p>}
          </div>

          {/* From / To selects */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="uc-from" className="block text-sm text-neutral-500 mb-1">From</label>
              <select id="uc-from" value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-800 focus:outline-none">
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="uc-to" className="block text-sm text-neutral-500 mb-1">To</label>
              <select id="uc-to" value={to} onChange={e => setTo(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-800 focus:outline-none">
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Result */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 rounded-xl p-6 text-center">
            <div className="text-4xl font-extrabold text-indigo-500 break-all" data-result>{convert()} {to}</div>
            {parsed.ambiguous && <p role="alert" className="text-amber-800 text-sm">Is {parsed.ambiguous} one thousand or one? Write {parsed.ambiguous.replace(',', '')} for a thousand, or {parsed.ambiguous.replace(',', '.').replace(/0+$/, '').replace(/\.$/, '')} for one.</p>}
            <div className="text-neutral-500 mt-2">{invalid ? '—' : show(value)} {from} = {convert()} {to}</div>
            {category !== 'Temperature' && category !== 'Fuel economy' && <div className="text-xs text-neutral-500 mt-1" data-factor>1 {from} = {show(raw(1, from, to))} {to}</div>}
          </div>

        </div>
      </div>
      <SeoContent
        title="Unit Converter"
        description="Unit Converter converts between units across twelve categories — Length, Weight, Temperature, Fuel economy, Speed, Area, Volume, Time, Data, Pressure, Energy and Power — entirely in your browser, with results updating instantly as you type. Factors are the exact definitions (1 inch = 25.4 mm, 1 psi = 6894.757… Pa, 1 calorie = 4.184 J)."
        howTo={[
          "Click a category button (Length, Weight, Temperature, Speed, Area, Volume, Time, Data, Pressure, Energy or Power) to select what you're converting.",
          "Enter the value you want to convert.",
          "Choose your source unit in the \"From\" dropdown and your target unit in the \"To\" dropdown.",
          "Read the converted result, updated instantly below, with the factor for one unit underneath."
        ]}
        faqs={[
          { q: "Is Unit Converter free to use?", a: "Yes, it's completely free with no signup and no limits." },
          { q: "What categories are supported?", a: "Length (nm to nautical miles), Weight (including stone, carat, US and UK tons), Temperature (°C, °F, K, °R), Fuel economy (L/100 km, mpg US and UK, km/L), Speed, Area, Volume, Time, Data (bits and bytes, decimal kB/MB/GB and binary KiB/MiB/GiB), Pressure (Pa, bar, atm, psi, mmHg, inHg, torr), Energy (J, Wh, kWh, cal, kcal, BTU, eV, ft·lbf) and Power (W, kW, hp, metric hp, BTU/h, kcal/h)." },
          { q: "How accurate are the results?", a: "Factors are the exact definitions (NIST SP 811), and results show up to 12 significant digits, in scientific notation when very large or very small. Month and year are Gregorian averages (365.2425 days a year); calories are thermochemical (4.184 J) and BTU are International Table BTU." },
          { q: "Is my data private?", a: "Yes, everything is calculated locally in your browser — what you enter is never sent to a server." }
        ]}
        tips={[
          "Switch categories using the buttons at the top — your \"From\" and \"To\" units reset to that category's first two units.",
          "For temperature, remember the conversion isn't a simple multiplier like the other categories, since Celsius, Fahrenheit, and Kelvin use different zero points.",
          "A kB is 1000 bytes and a KiB is 1024: disk makers use the first, many operating systems the second.",
          "Bookmark this page for quick access to conversions you use often in cooking, DIY, or technical work."
        ]}
      />
    </div>
  );
}
