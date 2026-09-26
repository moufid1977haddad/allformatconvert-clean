// Improvement 16: Unit Converter (Time, Data, Pressure, Energy, Power added) and Color Converter (HSV, CMYK, invalid
// HEX message), real pages. Expected values are computed HERE from the definitions (SI / NIST SP 811), never by the
// page. With --refs, the same conversions are typed into unitconverters.net and the same colours into RapidTables,
// and their answers are compared with the same expected values.
// Usage: node scripts/browser-tests/unit-color-converter.mjs <origin> [--browser=firefox] [--refs]
import { chromium, firefox } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const refs = process.argv.includes('--refs');
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const rel = (a, b) => (b === 0 ? Math.abs(a) : Math.abs(a - b) / Math.abs(b));

// definitions, written independently of the page
const LBF = 0.45359237 * 9.80665, PSI = LBF / 0.0254 ** 2, MMHG = 13.5951 * 9.80665, BTU = 1055.05585262, EV = 1.602176634e-19, HP = 550 * 0.3048 * LBF;
// [category, from (ours), to (ours), value, expected, unitconverters.net page, their from, their to]
const UNITS = [
  ['Pressure', 'atm', 'psi', '1', 101325 / PSI, 'pressure-converter.html', /^Standard atmosphere/, /^psi/],
  ['Pressure', 'mmHg', 'Pa', '1', MMHG, 'pressure-converter.html', /^millimeter mercury \(0°C\)/, /^pascal \[Pa\]/],
  ['Pressure', 'bar', 'psi', '2.5', 2.5e5 / PSI, 'pressure-converter.html', /^bar$/, /^psi/],
  ['Energy', 'kWh', 'BTU', '1', 3.6e6 / BTU, 'energy-converter.html', /^kilowatt-hour/, /^Btu \(IT\)/],
  ['Energy', 'eV', 'kWh', '1', EV / 3.6e6, 'energy-converter.html', /^electron-volt/, /^kilowatt-hour/],
  ['Energy', 'kcal', 'kJ', '250', 250 * 4.184, 'energy-converter.html', /^kilocalorie \(th\)/, /^kilojoule/],
  ['Power', 'hp', 'W', '1', HP, 'power-converter.html', /^horsepower \(550 ft\*lbf\/s\)/, /^watt \[W\]/],
  ['Power', 'kW', 'hp (metric)', '100', 1e5 / (75 * 9.80665), 'power-converter.html', /^kilowatt/, /^horsepower \(metric\)/],
  ['Data', 'GiB', 'GB', '1', 2 ** 30 / 1e9, null],
  ['Data', 'MB', 'bit', '1.5', 1.5e6 * 8, null],
  ['Time', 'year (365.2425 days)', 'day', '1', 365.2425, 'time-converter.html', /^year \[y\]/, /^day \[d\]/],
  ['Time', 'week', 'min', '1', 10080, 'time-converter.html', /^week/, /^minute/],
  ['Length', 'mile', 'm', '1', 1609.344, 'length-converter.html', /^mile/, /^meter/],
  ['Temperature', 'C', 'F', '-40', -40, null],
];
const COLOURS = ['#3b82f6', '#ff0000', '#00ff7f', '#808080', '#000000', '#123456', '#7f7f80'];
// independent formulas: HSV, HSL, CMYK rounded to whole units, as RapidTables and ColorHexa show them
function expectColour(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0; if (d) { if (max === r) h = 60 * (((g - b) / d) % 6); else if (max === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4); } if (h < 0) h += 360;
  const l = (max + min) / 2, sl = d ? d / (1 - Math.abs(2 * l - 1)) : 0, sv = max ? d / max : 0, k = 1 - max;
  const c = (x) => (k >= 1 ? 0 : Math.round(((1 - x - k) / (1 - k)) * 100));
  return { hsl: `hsl(${Math.round(h) % 360}, ${Math.round(sl * 100)}%, ${Math.round(l * 100)}%)`, hsv: `hsv(${Math.round(h) % 360}, ${Math.round(sv * 100)}%, ${Math.round(max * 100)}%)`, cmyk: `cmyk(${c(r)}%, ${c(g)}%, ${c(b)}%, ${Math.round(k * 100)}%)` };
}

const b = await engine.launch(); const ctx = await b.newContext();
const page = await ctx.newPage();

/* ---------- Unit Converter ---------- */
await page.goto(origin + '/tools/converter-tools/unit-converter', { waitUntil: 'networkidle' });
const ours = {};
for (const [cat, from, to, value, want] of UNITS) {
  await page.getByRole('button', { name: cat, exact: true }).click();
  await page.locator('#uc-from').selectOption(from); await page.locator('#uc-to').selectOption(to);
  await page.locator('#uc-value').fill(value);
  const shown = (await page.locator('[data-result]').innerText()).trim();
  const num = Number(shown.slice(0, shown.lastIndexOf(' ' + to)).trim());
  ours[`${from}>${to}`] = { shown, err: rel(num, want) };
  check(`unit: ${value} ${from} -> ${to} = ${want} (12 significant digits)`, rel(num, want) < 5e-12, shown);
}
for (const [txt, ok] of [['abc', false], ['', false], ['1e3', true], ['-12,5', true]]) {
  await page.getByRole('button', { name: 'Length', exact: true }).click();
  await page.locator('#uc-value').fill(txt);
  const alert = await page.locator('[role=alert]:not(#__next-route-announcer__)').count(); const res = (await page.locator('[data-result]').innerText()).trim();
  check(`unit: "${txt}" ${ok ? 'accepted' : 'refused with a message, no result'}`, ok ? alert === 0 && !res.startsWith('—') : alert === 1 && res.startsWith('—'), res);
}
{
  await page.getByRole('button', { name: 'Temperature', exact: true }).click();
  await page.locator('#uc-from').selectOption('K'); await page.locator('#uc-value').fill('-5');
  check('unit: -5 K flagged as below absolute zero', /absolute zero/.test(await page.locator('[role=alert]:not(#__next-route-announcer__)').innerText().catch(() => '')));
}

/* ---------- Color Converter ---------- */
await page.goto(origin + '/tools/converter-tools/color-converter', { waitUntil: 'networkidle' });
const css = async () => Object.fromEntries(await Promise.all(['rgb', 'hsl', 'hsv', 'cmyk'].map(async (k) => [k, (await page.locator(`[data-css="${k}"]`).innerText()).trim()])));
const oursColour = {};
for (const hex of COLOURS) {
  await page.locator('#cc-hex').fill(hex);
  const got = await css(); const want = expectColour(hex); oursColour[hex] = got;
  check(`colour ${hex}: HSL, HSV, CMYK`, got.hsl === want.hsl && got.hsv === want.hsv && got.cmyk === want.cmyk, JSON.stringify(got));
}
{
  await page.locator('#cc-hex').fill('#3b82f6'); await page.locator('#cc-hex').fill('zzz');
  const alert = await page.locator('[role=alert]:not(#__next-route-announcer__)').innerText().catch(() => '');
  const swatch = await page.locator('[data-swatch]').getAttribute('data-swatch');
  check('colour: invalid HEX "zzz" -> message, swatch keeps #3b82f6', /not a HEX colour/.test(alert) && swatch === '#3b82f6', alert.slice(0, 90));
  await page.locator('#cc-hex').fill('#abc');
  check('colour: "#abc" -> #aabbcc', (await page.locator('[data-swatch]').getAttribute('data-swatch')) === '#aabbcc' && (await page.locator('[role=alert]:not(#__next-route-announcer__)').count()) === 0);
  for (const [k, v] of [['c', '100'], ['m', '0'], ['y', '0'], ['k', '0']]) await page.locator(`#cc-cmyk-${k}`).fill(v);
  check('colour: CMYK 100/0/0/0 typed -> #00ffff', (await page.locator('[data-swatch]').getAttribute('data-swatch')) === '#00ffff');
  for (const [k, v] of [['h', '120'], ['s', '100'], ['v', '100']]) await page.locator(`#cc-hsv-${k}`).fill(v);
  check('colour: HSV 120/100/100 typed -> #00ff00', (await page.locator('[data-swatch]').getAttribute('data-swatch')) === '#00ff00');
}

/* ---------- references ---------- */
if (refs) {
  const p = await ctx.newPage();
  console.log('\nREFERENCE unitconverters.net (same inputs, same expected values)');
  for (const [, from, to, value, want, url, rf, rt] of UNITS) {
    if (!url) { console.log('REF', `${from}>${to}`, 'not compared'); continue; }
    try {
      await p.goto('https://www.unitconverters.net/' + url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const pick = async (sel, re) => { const v = await p.locator(sel).evaluate((s, src) => { const r = new RegExp(src); return [...s.options].find((o) => r.test(o.text))?.value ?? null; }, re.source); if (v == null) throw new Error('no option ' + re); await p.locator(sel).selectOption(v); };
      await pick('#ucfromunit', rf); await pick('#uctounit', rt);
      await p.locator('#ucfrom').fill(''); await p.locator('#ucfrom').pressSequentially(value); await p.waitForTimeout(300);
      const theirs = (await p.locator('#ucto').inputValue()).trim(); const num = Number(theirs.replace(/,/g, '').replace(/E/i, 'e'));
      console.log('REF', `${value} ${from}>${to}`, 'want', want, '| ours', ours[`${from}>${to}`]?.shown, 'err', ours[`${from}>${to}`]?.err.toExponential(1), '| theirs', theirs, 'err', rel(num, want).toExponential(1));
    } catch (e) { console.log('REF', `${from}>${to}`, 'FAILED', e.message.split('\n')[0]); }
  }
  console.log('\nREFERENCE RapidTables (same colours)');
  for (const hex of COLOURS) {
    const [r, g, bb] = [1, 3, 5].map((i) => String(parseInt(hex.slice(i, i + 2), 16)));
    const read = async (url, names, btn) => {
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      for (const [k, v] of [['r', r], ['g', g], ['b', bb]]) await p.locator(`#${k}`).fill(v);
      await p.locator(btn).first().click(); await p.waitForTimeout(300);
      return Promise.all(names.map((n) => p.locator(`input[name=${n}]`).first().inputValue()));
    };
    try {
      // Its RGB->HSV page is not used: driven the same way it answered #808080 with V = 100 % (26/09/2026), so HSV
      // is checked against the formula above only.
      const cmyk = await read('https://www.rapidtables.com/convert/color/rgb-to-cmyk.html', ['c', 'm', 'y', 'k'], 'button:has-text("Convert")');
      const same = `cmyk(${cmyk.map((x) => Math.round(Number(x))).join('%, ')}%)` === oursColour[hex]?.cmyk;
      console.log('REF', hex, '| RapidTables CMYK', cmyk.join(' / '), '| ours', oursColour[hex]?.cmyk, same ? 'SAME' : 'DIFFERENT', '| expected', expectColour(hex).cmyk);
    } catch (e) { console.log('REF', hex, 'FAILED', e.message.split('\n')[0]); }
  }
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
await b.close(); process.exit(fails ? 1 : 0);
