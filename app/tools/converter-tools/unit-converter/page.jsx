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
        description={`Unit Converter covers 12 categories: Length, Weight, Temperature, Fuel economy, Speed, Area, Volume, Time, Data, Pressure, Energy and Power. Every factor is an exact definition, such as 1 inch = 25.4 mm, 1 lb = 0.45359237 kg or 1 calorie = 4.184 J, so results are not built on rounded constants. The answer updates as you type and keeps up to 12 significant digits. Temperature and fuel economy use formulas instead of factors, because their scales start at different zeros or run in opposite directions. Money is not covered here: the Currency Converter does that with daily rates.`}
        example={{
          caption: 'Six conversions and the result the page shows for each (the page\'s own factors and display code, run in Node on October 6, 2026).',
          inputLabel: 'Category, value and units',
          input: 'Length: 1 mile → km\nLength: 1 km → inch\nTemperature: 100 F → C\nFuel economy: 8 L/100 km → mpg (US)\nData: 1 GiB → MB\nPressure: 1 psi → kPa',
          outputLabel: 'Result',
          output: '1.609344 km\n39370.0787402 inch\n37.7777777778 C\n29.4018229167 mpg (US)\n1073.741824 MB\n6.89475729317 kPa',
        }}
        howToTitle="How to convert units"
        howTo={[
          `Click a category button such as "Length", "Fuel economy" or "Data"; "From" and "To" switch to its first two units.`,
          `Type the number in "Value": decimals, negative values and forms like 6.02e23 work, and spaces between thousands are ignored.`,
          `Pick the units in "From" and "To".`,
          'Read the result; for every category except temperature and fuel economy, the line below it gives the factor for one unit.',
        ]}
        specs={[
          { label: 'Categories', value: 'Length, Weight, Temperature, Fuel economy, Speed, Area, Volume, Time, Data, Pressure, Energy, Power' },
          { label: 'Some of the units', value: 'nm to nautical miles; stone, carat, US and UK tons; Celsius, Fahrenheit, Kelvin, Rankine; L/100 km, km/L, mpg US and UK; bits, kB to PB and KiB to TiB; Pa to MPa, mbar, bar, atm, psi, mmHg, inHg, torr; J to MJ, Wh, kWh, cal, kcal, BTU, eV, ft·lbf; W, kW, MW, hp, metric hp, BTU/h, kcal/h' },
          { label: 'Precision', value: 'Up to 12 significant digits; scientific notation below 0.000001 and from 1e15 up' },
          { label: 'Typing', value: 'A single comma counts as a decimal point; a value such as 1,000 is refused as ambiguous, and the page asks you to write 1000 or 1' },
          { label: 'Checks', value: 'A warning below absolute zero; fuel economy must be above 0' },
        ]}
        privacyTitle="Where your values are processed"
        privacy="Each result is your value multiplied by fixed factors written in the page, or put through the temperature and fuel economy formulas, all in your browser; the values you type are not sent anywhere. Should the converter crash, our error watch sends the cleaned error message with the tool's name and your browser's name and major version, never the value or the units you chose."
        faqs={[
          { q: 'Is a kilobyte 1000 or 1024 bytes here?', a: '1000. The page follows the SI prefixes: kB, MB, GB, TB and PB are powers of 1000, while KiB, MiB, GiB and TiB are powers of 1024, and bits are listed separately. So 1 GiB converts to 1073.741824 MB.' },
          { q: 'Are US and UK gallons different?', a: 'Yes. A US gallon is 3.785411784 liters and a UK gallon 4.54609 liters. Volume lists both, along with US and UK pints and fluid ounces, and Fuel economy offers mpg (US) and mpg (UK), which differ for the same reason.' },
          { q: 'How precise are the results?', a: '12 significant digits at most, from exact definitions in NIST SP 811: 1 psi is 6894.757… Pa and 1 BTU is 1055.05585262 J. A month is one twelfth of a Gregorian year of 365.2425 days, and calories are thermochemical (4.184 J).' },
          { q: 'Why is there no factor line for temperature?', a: 'No single factor exists. Celsius, Fahrenheit, Kelvin and Rankine start at different zero points, and L/100 km is the inverse of km/L, so the page converts them with formulas and shows only the result.' },
        ]}
        tips={[
          'Paste figures written with spaces between thousands, such as 12 500: the page reads them as one number.',
        ]}
      />
    </div>
  );
}
