'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseHex, rgbText } from './parseHex';
const START = '#3b82f6';
// Checkerboard under a color with an alpha channel, so that transparency is visible.
const CHECKER = 'repeating-conic-gradient(#d4d4d4 0 25%, #ffffff 0 50%) 0 0 / 16px 16px';
export default function ColorPickerPage() {
  // P37 (06/10): what is typed and the color shown are kept apart. A code without "#", a 3- or 4-digit shorthand and an
  // 8-digit code with alpha are read (parseHex.js); anything else leaves the last valid color and says why.
  const [text, setText] = useState(START);
  const [color, setColor] = useState(() => parseHex(START));
  const [error, setError] = useState('');
  const onType = (v) => {
    setText(v);
    const c = parseHex(v);
    if (c) { setColor(c); setError(''); } else setError(v.trim() ? 'Not a HEX color: type 3, 4, 6 or 8 hexadecimal digits, with or without #, for example ff8800.' : '');
  };
  const onPick = (v) => { const c = parseHex(v); if (c) { setColor(c); setText(c.hex); setError(''); } };
  const rgb = rgbText(color);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Color Picker</h1>
        <p className="text-neutral-500 text-center mb-8">Pick and convert colors</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex justify-center"><div className="w-48 h-48 rounded-xl border-4 border-neutral-200" style={{ background: color.a < 1 ? `linear-gradient(${color.hex}, ${color.hex}), ${CHECKER}` : color.hex }} /></div>
          <div className="flex justify-center"><input aria-label="Pick a color" type="color" value={color.rgbHex} onChange={e => onPick(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer border-0" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center"><div className="text-neutral-500 text-xs mb-1">HEX</div><div className="font-mono text-indigo-400">{color.hex}</div><button onClick={() => navigator.clipboard.writeText(color.hex)} className="text-xs text-neutral-500 hover:text-neutral-300">Copy</button></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center"><div className="text-neutral-500 text-xs mb-1">RGB</div><div className="font-mono text-indigo-400 text-xs">{rgb.replace(/^rgba?\(|\)$/g, '')}</div><button onClick={() => navigator.clipboard.writeText(rgb)} className="text-xs text-neutral-500 hover:text-neutral-300">Copy</button></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center"><div className="text-neutral-500 text-xs mb-1">Input</div><input aria-label="Color value (HEX)" aria-invalid={!!error} aria-describedby="hex-error" type="text" value={text} onChange={e => onType(e.target.value)} className="w-full bg-neutral-200 rounded p-1 text-center font-mono text-sm" /></div>
          </div>
          <p id="hex-error" role="status" className="text-red-400 text-sm text-center min-h-5">{error}</p>
        </div>
      </div>
      <SeoContent
        title="Color Picker"
        description={"Color Picker shows a large preview of one color with its HEX and RGB values. You choose the color with your browser’s built-in color picker (the small swatch under the preview) or by typing a code in the Input box. A HEX code is read with or without its # sign, in 3, 4, 6 or 8 digits, so ff0000, #f00 and #ff000080 all work; the 4- and 8-digit forms carry an alpha channel, shown over a checkerboard. Color names such as red are refused with a message, and the preview keeps the last valid color. For HSL, HSV or CMYK values, use Color Converter."}
        example={{
          caption: "A code typed without its # sign and the values the page shows, from its own HEX parser.",
          inputLabel: "Typed in Input",
          input: "ff8800",
          outputLabel: "Cards and clipboard",
          output: "HEX: #ff8800\nRGB: 255,136,0\nCopy under RGB puts on the clipboard: rgb(255,136,0)",
        }}
        howToTitle={"How to pick a color and get its RGB value"}
        howTo={[
          "Click the small color swatch under the large preview to open your browser’s color picker, then choose a color.",
          "Or type a code in \"Input\", with or without #, for example ff8800 or #f80: the preview, the swatch and both cards follow once the code is complete.",
          "Read the \"RGB\" card, which shows the red, green and blue values separated by commas, then the alpha value when the code has one.",
          "Click \"Copy\" under \"HEX\" or \"RGB\": the HEX card copies the code as shown, in lower case with #, and the RGB card copies it as rgb(r,g,b), or rgba(r,g,b,a) for a code with alpha.",
        ]}
        specs={[
          { label: "Input", value: "The browser’s color picker, or a HEX code typed in the Input box" },
          { label: "HEX codes read", value: "3, 4, 6 or 8 digits (#rgb, #rgba, #rrggbb, #rrggbbaa), # optional, upper or lower case" },
          { label: "Output", value: "HEX in lower case with #; RGB shown as r,g,b (r,g,b,a with alpha) and copied as rgb(r,g,b) or rgba(r,g,b,a)" },
          { label: "Not included", value: "HSL, CMYK, color names, saved palettes, sampling from an image (Color Converter covers HSL and CMYK)" },
        ]}
        privacyTitle={"Where your color is processed"}
        privacy={"The color you pick or type stays on this page: the conversion to RGB is done by the page’s own code and the color is never sent to our servers. The Copy buttons use your browser’s clipboard. The color picker window belongs to your browser, so what it offers, an eyedropper in some browsers for example, depends on the browser and not on this site."}
        faqs={[
          { q: "Does the RGB card read short codes such as #f80?", a: "Yes. #f80 is read as #ff8800 and gives 255,136,0. A 4-digit code such as #f808 or an 8-digit code such as #ff880080 adds an alpha channel: the RGB card shows it as a fourth value between 0 and 1 (255,136,0,0.502 for #ff880080), and the browser’s swatch, which has no alpha, shows the color as opaque." },
          { q: "Do I need to type the # sign?", a: "No. ff8800 and #ff8800 give the same color, and the HEX card then shows #ff8800. Text that is not 3, 4, 6 or 8 hexadecimal digits, such as ff880 or a color name such as red, is refused with a message, and the preview keeps the previous color." },
          { q: "Can I get HSL or CMYK values here?", a: "No. This page gives HEX and RGB only. Color Converter, in the converter tools, converts between HEX, RGB, HSL, HSV and CMYK and has the same browser color picker." },
          { q: "Does Copy add rgb() around the RGB value?", a: "Yes. The RGB card shows 255,136,0 but copies rgb(255,136,0), ready to paste into a stylesheet; with an alpha channel it copies rgba(255,136,0,0.502). The HEX card copies the code as shown, in lower case with its # sign." },
        ]}
      />
    </div>
  );
}