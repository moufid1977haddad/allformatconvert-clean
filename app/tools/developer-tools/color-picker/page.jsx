'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ColorPickerPage() {
  const [color, setColor] = useState('#3b82f6');
  const hexToRgb = (hex) => { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null; };
  const rgb = hexToRgb(color);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Color Picker</h1>
        <p className="text-neutral-500 text-center mb-8">Pick and convert colors</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex justify-center"><div className="w-48 h-48 rounded-xl border-4 border-neutral-200" style={{backgroundColor: color}} /></div>
          <div className="flex justify-center"><input aria-label="Pick a colour" type="color" value={color} onChange={e => setColor(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer border-0" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center"><div className="text-neutral-500 text-xs mb-1">HEX</div><div className="font-mono text-indigo-400">{color}</div><button onClick={() => navigator.clipboard.writeText(color)} className="text-xs text-neutral-500 hover:text-neutral-300">Copy</button></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center"><div className="text-neutral-500 text-xs mb-1">RGB</div><div className="font-mono text-indigo-400 text-xs">{rgb ? `${rgb.r},${rgb.g},${rgb.b}` : ''}</div><button onClick={() => navigator.clipboard.writeText(rgb ? `rgb(${rgb.r},${rgb.g},${rgb.b})` : '')} className="text-xs text-neutral-500 hover:text-neutral-300">Copy</button></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center"><div className="text-neutral-500 text-xs mb-1">Input</div><input aria-label="Colour value (HEX)" type="text" value={color} onChange={e => setColor(e.target.value)} className="w-full bg-neutral-200 rounded p-1 text-center font-mono text-sm" /></div>
          </div>
        </div>
      </div>
      <SeoContent
        title="Color Picker"
        description={"Color Picker shows a large preview of one color with its HEX and RGB values. You choose the color with your browser’s built-in color picker (the small swatch under the preview) or by typing a code in the Input box. Only 6-digit HEX codes are converted to RGB, with or without the # sign; 3-digit codes, codes with an alpha channel and names such as red leave the RGB card empty. The HEX card shows exactly what was picked or typed. For HSL, HSV or CMYK values, use Color Converter."}
        example={{
          caption: "A typed code and the values the page shows, from its own HEX-to-RGB function.",
          inputLabel: "Typed in Input",
          input: "#ff8800",
          outputLabel: "Cards and clipboard",
          output: "HEX: #ff8800\nRGB: 255,136,0\nCopy under RGB puts on the clipboard: rgb(255,136,0)",
        }}
        howToTitle={"How to pick a color and get its RGB value"}
        howTo={[
          "Click the small color swatch under the large preview to open your browser’s color picker, then choose a color.",
          "Or type a code with its # in \"Input\", for example #ff8800: the preview and the HEX card follow what you type.",
          "Read the \"RGB\" card, which shows the red, green and blue values separated by commas.",
          "Click \"Copy\" under \"HEX\" or \"RGB\": the HEX card copies the code as shown, the RGB card copies it as rgb(r,g,b).",
        ]}
        specs={[
          { label: "Input", value: "The browser’s color picker, or a HEX code typed in the Input box" },
          { label: "RGB conversion", value: "6-digit HEX codes only, # optional, upper or lower case" },
          { label: "Output", value: "HEX as picked or typed; RGB shown as r,g,b and copied as rgb(r,g,b)" },
          { label: "Not included", value: "HSL, CMYK, alpha, saved palettes, sampling from an image (Color Converter covers HSL and CMYK)" },
        ]}
        privacyTitle={"Where your color is processed"}
        privacy={"The color you pick or type stays on this page: the conversion to RGB is done by the page’s own code and the color is never sent to our servers. The Copy buttons use your browser’s clipboard. The color picker window belongs to your browser, so what it offers, an eyedropper in some browsers for example, depends on the browser and not on this site."}
        faqs={[
          { q: "Does the RGB card read short codes such as #f80?", a: "No. Only six hexadecimal digits are converted, so the card stays empty for them: shorthand such as #f80, eight-digit codes with alpha and color names such as red are not converted. Type the full code instead, for example #ff8800, which gives 255,136,0." },
          { q: "Do I need to type the # sign?", a: "Yes, for the preview: without it, the large preview keeps the previous color and the browser’s swatch turns black, because both need a valid CSS color. The RGB conversion alone accepts the code with or without #." },
          { q: "Can I get HSL or CMYK values here?", a: "No. This page gives HEX and RGB only. Color Converter, in the converter tools, converts between HEX, RGB, HSL, HSV and CMYK and has the same browser color picker." },
          { q: "Does Copy add rgb() around the RGB value?", a: "Yes. The RGB card shows 255,136,0 but copies rgb(255,136,0), ready to paste into a stylesheet. The HEX card copies the code exactly as shown, including a typed name such as red." },
        ]}
      />
    </div>
  );
}