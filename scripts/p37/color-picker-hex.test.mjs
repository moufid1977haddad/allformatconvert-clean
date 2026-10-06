// P37 lot 1, item 4: Color Picker and a HEX code typed without "#" (and short / alpha codes).
// Run: node scripts/p37/color-picker-hex.test.mjs
// "before" reproduces the page's old logic (state = typed text; preview = CSS backgroundColor = text, so "ff0000"
// is an invalid CSS color and the preview keeps the old one; RGB card = 6-digit regex only).
import { parseHex, rgbText } from '../../app/tools/developer-tools/color-picker/parseHex.js';

const mode = process.argv[2] === 'before' ? 'before' : 'after';
const oldHexToRgb = (hex) => { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null; };
const cssHexValid = (t) => /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t); // what backgroundColor accepts among hex forms
function before(t) {
  const rgb = oldHexToRgb(t);
  return { preview: cssHexValid(t) ? t.toLowerCase() : 'unchanged', swatch: /^#[0-9a-f]{6}$/i.test(t) ? t.toLowerCase() : '#000000', rgb: rgb ? `rgb(${rgb.r},${rgb.g},${rgb.b})` : '' };
}
function after(t) {
  const c = parseHex(t);
  return c ? { preview: c.hex, swatch: c.rgbHex, rgb: rgbText(c) } : { preview: 'unchanged', swatch: 'unchanged', rgb: 'error shown' };
}
const cases = [
  ['ff0000 without #', 'ff0000', { preview: '#ff0000', swatch: '#ff0000', rgb: 'rgb(255,0,0)' }],
  ['f00 without #', 'f00', { preview: '#ff0000', swatch: '#ff0000', rgb: 'rgb(255,0,0)' }],
  ['#f80 shorthand', '#f80', { preview: '#ff8800', swatch: '#ff8800', rgb: 'rgb(255,136,0)' }],
  ['8 digits with alpha', '#ff000080', { preview: '#ff000080', swatch: '#ff0000', rgb: 'rgba(255,0,0,0.502)' }],
  ['4 digits with alpha, no #', 'f008', { preview: '#ff000088', swatch: '#ff0000', rgb: 'rgba(255,0,0,0.533)' }],
  ['upper case and spaces', '  #FF8800 ', { preview: '#ff8800', swatch: '#ff8800', rgb: 'rgb(255,136,0)' }],
  ['full code with #', '#3b82f6', { preview: '#3b82f6', swatch: '#3b82f6', rgb: 'rgb(59,130,246)' }],
  ['invalid: 5 digits', 'ff000', { preview: 'unchanged', swatch: 'unchanged', rgb: 'error shown' }],
  ['invalid: not hex', 'gg0000', { preview: 'unchanged', swatch: 'unchanged', rgb: 'error shown' }],
];
let fail = 0;
console.log(`mode: ${mode}`);
for (const [name, input, want] of cases) {
  const got = (mode === 'before' ? before : after)(input);
  const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`);
}
console.log(`\n${cases.length - fail}/${cases.length} passed`);
process.exit(fail ? 1 : 0);
