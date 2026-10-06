// P37 lot 1, item 5: the 5 Barcode Generator types no browser reader decodes (zxing: null in symbologies.js) --
// MSI Plessey, Pharmacode, Code 11, EAN-5 and EAN-2. Each code is drawn with the page's own options (render.js
// bwipOptions, page defaults) by bwip-js (same BWIPP engine as the page's bwip-js/browser), then decoded here from
// its bar/space widths with decoders written from the specifications, check digits recomputed independently.
// Invalid values must be refused with the message the page shows (render.js cleanError).
// Run: node --import ./scripts/p37/misc-ext-loader.mjs scripts/p37/barcode-unread-types.test.mjs
import bwip from 'bwip-js';
import { bwipOptions, physical, cleanError } from '../../app/tools/qr-barcodes-tools/barcode-generator/render.js';
import { byId, ALL } from '../../app/tools/qr-barcodes-tools/barcode-generator/symbologies.js';

const UI = { unit: 'mm', module: 0.33, dpi: 300, height: 15, textPt: 10, showText: true, barColor: '#000000', bgColor: '#FFFFFF',
  transparent: false, textColor: '#000000', rotate: 'N', quiet: '', checkDigit: false, msiCheck: 'mod10', qrEc: 'M',
  dmShape: 'square', pdfColumns: '', pdfEc: '', aztecEc: 23, caption: '' };
function sbs(bcid, text, ui = {}) {
  const u = { ...UI, ...ui }; const p = physical(u);
  const opts = bwipOptions(byId(bcid), text, u, p.pxPerModule, p.dpi / 25.4);
  return bwip.raw(opts)[0].sbs;
}

// ---- decoders (bar/space widths, bar first) ----
// MSI: start = wide bar + narrow space; each digit = 4 bits, 1 = wide bar + narrow space, 0 = narrow bar + wide space;
// stop = narrow bar, wide space, narrow bar.
function decodeMsi(w) {
  if (!(w[0] > w[1])) throw new Error('MSI start');
  let out = ''; let i = 2;
  while (i + 3 < w.length) { let d = 0; for (let k = 0; k < 4; k++, i += 2) d = d * 2 + (w[i] > w[i + 1] ? 1 : 0); if (d > 9) throw new Error('MSI digit ' + d); out += d; }
  if (w.length - i !== 3 || !(w[i] < w[i + 1] && w[i + 2] < w[i + 1])) throw new Error('MSI stop');
  return out;
}
// Pharmacode (Laetus): a narrow bar (1 module) is worth 1, a wide bar (3 modules) 2, read left to right: v = 2v + 1|2.
// Bars are told apart by comparison with the fixed space (2 modules), so a code of only wide bars (131070) reads right.
function decodePharmacode(w) { let v = 0; for (let i = 0; i < w.length; i += 2) v = v * 2 + (w[i] > (w[1] ?? 2) ? 2 : 1); return String(v); }
// Code 11: 5 elements per character (n/w), narrow gap between characters, start/stop "*".
const C11 = { nnnnw: '0', wnnnw: '1', nwnnw: '2', wwnnn: '3', nnwnw: '4', wnwnn: '5', nwwnn: '6', nnnww: '7', wnnwn: '8', wnnnn: '9', nnwnn: '-', nnwwn: '*' };
function decodeCode11(w) {
  const n = Math.min(...w); let out = '';
  for (let i = 0; i < w.length; i += 6) {
    const k = w.slice(i, i + 5).map((x) => (x > 1.5 * n ? 'w' : 'n')).join('');
    if (!C11[k]) throw new Error('Code 11 pattern ' + k); out += C11[k];
  }
  return out;
}
// EAN-5 / EAN-2 add-on: start 1011, digits in L or G code (4 widths, space first), separators 01.
const L = ['3211', '2221', '2122', '1411', '1132', '1231', '1114', '1312', '1213', '3112'];
const G = L.map((x) => [...x].reverse().join('')).map((x) => x); // G = R reversed; R widths equal L widths
function decodeAddon(w) {
  if (w.slice(0, 3).join('') !== '112') throw new Error('add-on start');
  let digits = '', parity = '';
  for (let i = 3; i < w.length; i += 6) {
    const k = w.slice(i, i + 4).join('');
    const l = L.indexOf(k), g = G.indexOf(k);
    if (l < 0 && g < 0) throw new Error('add-on digit ' + k);
    digits += l >= 0 ? l : g; parity += l >= 0 ? 'L' : 'G';
    if (i + 4 < w.length && w.slice(i + 4, i + 6).join('') !== '11') throw new Error('add-on separator');
  }
  return { digits, parity };
}

// ---- check digits, recomputed from the specifications ----
const luhnMsi = (s) => { // MSI Mod 10 (Luhn): double every second digit from the right, starting with the last
  let sum = 0; [...s].reverse().forEach((c, i) => { let d = +c; if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; } sum += d; });
  return String((10 - (sum % 10)) % 10);
};
const mod11Msi = (s) => { // MSI Mod 11 (IBM weights 2..7 from the right); a remainder giving 10 is written "10"
  let sum = 0; [...s].reverse().forEach((c, i) => { sum += +c * ((i % 6) + 2); });
  const c = (11 - (sum % 11)) % 11; return String(c);
};
const code11Checks = (v) => { const val = (c) => (c === '-' ? 10 : Number(c)); const ck = (s, max) => { let sum = 0; [...s].reverse().forEach((c, i) => { sum += val(c) * ((i % max) + 1); }); const r = sum % 11; return r === 10 ? '-' : String(r); }; const c = ck(v, 10); return v.length >= 10 ? c + ck(v + c, 9) : c; };
const EAN5_PARITY = ['GGLLL', 'GLGLL', 'GLLGL', 'GLLLG', 'LGGLL', 'LLGGL', 'LLLGG', 'LGLGL', 'LGLLG', 'LLGLG'];
const ean5Parity = (s) => EAN5_PARITY[(3 * (+s[0] + +s[2] + +s[4]) + 9 * (+s[1] + +s[3])) % 10];
const ean2Parity = (s) => ['LL', 'LG', 'GL', 'GG'][Number(s) % 4];

let fail = 0;
const check = (name, ok, info = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  -- ${info}`}`); };

console.log(`types without a reader: ${ALL.filter((s) => !s.zxing).map((s) => s.label).join(', ')}`);
check('exactly these 5 types have no reader', ALL.filter((s) => !s.zxing).map((s) => s.bcid).join() === 'msi,pharmacode,code11,ean5,ean2');

// MSI, every scheme the page offers
for (const v of ['1234567', '0', '6', '80523', '9999999999']) {
  check(`MSI ${v}, no check digit`, decodeMsi(sbs('msi', v, { msiCheck: 'none' })) === v);
  const m10 = v + luhnMsi(v);
  check(`MSI ${v}, Mod 10 -> ${m10}`, decodeMsi(sbs('msi', v, { msiCheck: 'mod10' })) === m10, decodeMsi(sbs('msi', v, { msiCheck: 'mod10' })));
  const m1010 = m10 + luhnMsi(m10);
  check(`MSI ${v}, Mod 10 + Mod 10 -> ${m1010}`, decodeMsi(sbs('msi', v, { msiCheck: 'mod1010' })) === m1010, decodeMsi(sbs('msi', v, { msiCheck: 'mod1010' })));
  if (mod11Msi(v) === '10') {
    // One number in 11 gets the Mod 11 value 10, which one MSI digit cannot hold: the page must say so plainly,
    // not show BWIPP's "mod11 check digit is 10 but badmod11 not specified".
    for (const scheme of ['mod11', 'mod1110']) {
      let msg = null; try { sbs('msi', v, { msiCheck: scheme }); } catch (e) { msg = cleanError(e); }
      check(`MSI ${v}, ${scheme}: check value 10, clear refusal: ${msg}`, !!msg && /Mod 11/.test(msg) && !/badmod11/.test(msg), String(msg));
    }
    continue;
  }
  const m11 = v + mod11Msi(v);
  check(`MSI ${v}, Mod 11 -> ${m11}`, decodeMsi(sbs('msi', v, { msiCheck: 'mod11' })) === m11, decodeMsi(sbs('msi', v, { msiCheck: 'mod11' })));
  const m1110 = m11 + luhnMsi(m11);
  check(`MSI ${v}, Mod 11 + Mod 10 -> ${m1110}`, decodeMsi(sbs('msi', v, { msiCheck: 'mod1110' })) === m1110, decodeMsi(sbs('msi', v, { msiCheck: 'mod1110' })));
}
// Pharmacode, range ends included
for (const v of ['3', '1234', '65535', '131070']) check(`Pharmacode ${v}`, decodePharmacode(sbs('pharmacode', v)) === v, decodePharmacode(sbs('pharmacode', v)));
// Code 11, with and without check digits (C, then K from 10 characters)
for (const v of ['0123-4567', '123', '0123456789', '0123456789-1']) {
  check(`Code 11 ${v}, no check digit`, decodeCode11(sbs('code11', v)) === `*${v}*`, decodeCode11(sbs('code11', v)));
  const want = `*${v}${code11Checks(v)}*`;
  check(`Code 11 ${v}, check digits -> ${want}`, decodeCode11(sbs('code11', v, { checkDigit: true })) === want, decodeCode11(sbs('code11', v, { checkDigit: true })));
}
// EAN-5 and EAN-2: digits and the parity pattern that carries their check
for (const v of ['51299', '00000', '90000', '12345']) { const d = decodeAddon(sbs('ean5', v)); check(`EAN-5 ${v} (parity ${ean5Parity(v)})`, d.digits === v && d.parity === ean5Parity(v), JSON.stringify(d)); }
for (const v of ['05', '00', '01', '02', '03', '99']) { const d = decodeAddon(sbs('ean2', v)); check(`EAN-2 ${v} (parity ${ean2Parity(v)})`, d.digits === v && d.parity === ean2Parity(v), JSON.stringify(d)); }

// Refusals, with the message the page shows
const refuse = [
  ['msi', '12A'], ['msi', '12.5'], ['pharmacode', '2'], ['pharmacode', '131071'], ['pharmacode', '12a'], ['pharmacode', '0'],
  ['code11', '12A4'], ['code11', '12 34'], ['ean5', '1234'], ['ean5', '123456'], ['ean5', '12a45'], ['ean2', '1'], ['ean2', '123'], ['ean2', 'ab'],
];
for (const [bcid, v] of refuse) {
  let msg = null; try { sbs(bcid, v); } catch (e) { msg = cleanError(e); }
  check(`${byId(bcid).label} refuses "${v}": ${msg}`, !!msg && !/bwipp|#\d/.test(msg), String(msg));
}
console.log(`\n${fail ? fail + ' failed' : 'all passed'}`);
process.exit(fail ? 1 : 0);
