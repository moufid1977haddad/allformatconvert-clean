'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { drawToRaster, encodeRaster, resultOf } from '../../../lib/imageOutput';
import { checkedDataURL, canvasSizeProblem } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

import { CANVAS_MAX_SIDE, CANVAS_MAX_AREA } from '../../../lib/mediaSupport';
export default function SvgToPngPage() {
  const [file, setFile] = useState(null);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  // Width and height used to stay at 512 x 512 whatever the SVG, so any SVG
  // that is not square was stretched without a word (29/09). Now the size is
  // read from the SVG (width/height, else viewBox), the longer side scaled
  // to 512 by default, and the ratio stays locked while editing, as
  // svgtopng.com and CloudConvert keep the proportions.
  const [ratio, setRatio] = useState(1);
  const [lock, setLock] = useState(true);
  // P24 (03/10): CloudConvert / ezgif let the background be set; an SVG without one gave only transparency here
  const [bg, setBg] = useState('');
  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setResult(null);
    setStatus('');
    if (!f) return;
    const text = await f.text();
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
    const num = (v) => { const m = /^\s*([\d.]+)\s*(px)?\s*$/.exec(v || ''); return m ? Number(m[1]) : NaN; };
    let w = num(svg.getAttribute('width'));
    let h = num(svg.getAttribute('height'));
    const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (!(w > 0 && h > 0) && vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
      if (w > 0) h = w * vb[3] / vb[2];
      else if (h > 0) w = h * vb[2] / vb[3];
      else { w = vb[2]; h = vb[3]; }
    }
    if (w > 0 && h > 0) {
      const scale = 512 / Math.max(w, h);
      setRatio(w / h);
      setWidth(Math.round(w * scale));
      setHeight(Math.round(h * scale));
    }
  };
  const changeWidth = (v) => { setWidth(v); if (lock && Number.isFinite(v)) setHeight(Math.max(1, Math.round(v / ratio))); };
  const changeHeight = (v) => { setHeight(v); if (lock && Number.isFinite(v)) setWidth(Math.max(1, Math.round(v * ratio))); };

  const dimsValid = Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0;

  const convert = async () => {
    if (!file) return;
    if (!dimsValid) { setStatus('Error: please enter valid width and height (positive numbers).'); return; }
    const sizeProblem = canvasSizeProblem(width, height);
    if (sizeProblem) { setStatus('Error: ' + sizeProblem); return; }
    setStatus('Converting...');
    try {
      const text = await file.text();
      const blob = new Blob([text], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = async () => {
        // 30/09: a large size (over 16.7 MP) is drawn in bands on iPhone; the result is a Blob, not a data: URL.
        try {
          const out = await drawToRaster(width, height, (ctx, y) => { if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, width, ctx.canvas.height); } ctx.drawImage(img, 0, -y, width, height); });
          setResult(resultOf(await encodeRaster(out, 'image/png'), file.name, ''));
          setStatus('');
        } catch (e) { reportShownMessage(e); setResult(null); setStatus('Error: ' + e.message); }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        setStatus('Error: could not render SVG as an image');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      reportShownMessage(err);
      setStatus('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SVG to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Rasterize SVG vectors to PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="an SVG file" />}</p>
            <input ref={inputRef} type="file" accept=".svg" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width (px)</label><input aria-label="Width (px)" type="number" value={width} onChange={e => changeWidth(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height (px)</label><input aria-label="Height (px)" type="number" value={height} onChange={e => changeHeight(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600"><input type="checkbox" checked={lock} onChange={e => setLock(e.target.checked)} /> Keep the SVG's proportions</label>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-neutral-500">Background</span>
            <label className="flex items-center gap-1"><input type="radio" name="svg-bg" checked={!bg} onChange={() => { setBg(''); setResult(null); }} /> Transparent</label>
            <label className="flex items-center gap-1"><input type="radio" name="svg-bg" checked={!!bg} onChange={() => { setBg('#ffffff'); setResult(null); }} /> Colour</label>
            {bg && <input id="svg-bg-color" type="color" value={bg} onChange={(e) => { setBg(e.target.value); setResult(null); }} aria-label="Background colour" />}
            {[1, 2, 4].map((k) => <button key={k} type="button" onClick={() => { const w0 = Math.round(512 * k); setWidth(w0); setHeight(Math.round(w0 / ratio)); setResult(null); }} className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200">{512 * k} px wide</button>)}
          </div>
          <button onClick={convert} disabled={!file || !dimsValid} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert to PNG</button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="space-y-2">
              <img alt="Preview of your image" src={result} className="max-h-48 mx-auto rounded" />
              <FileDownload href={result.url} name={result.name} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="SVG to PNG"
        description={`SVG to PNG turns a vector drawing into a PNG image of the size you choose. When the file is opened, the width and height boxes are filled from the SVG's own width and height, or its viewBox, with the longer side set to 512 pixels; while "Keep the SVG's proportions" is ticked, changing one side updates the other. The background stays transparent, or you can fill it with a colour. Because the SVG is drawn fresh at the chosen size, a large PNG stays sharp. There is no DPI setting: sizes are in pixels. The drawing is rendered by your browser on this page.`}
        howToTitle="How to convert SVG to PNG"
        howTo={[
          `Pick an .svg file in the upload area; the size boxes fill in from the drawing.`,
          `Type a value in "Width (px)" or "Height (px)", or click one of the 512, 1024 or 2048 px wide buttons.`,
          `Under "Background", keep "Transparent" or choose "Colour" and pick it.`,
          `Click "Convert to PNG", then "Download".`
        ]}
        specs={[
          { label: 'Input format', value: `SVG (.svg), one file` },
          { label: 'Output format', value: `PNG at the width and height you set` },
          { label: 'Largest PNG', value: `On a computer, ${CANVAS_MAX_SIDE.toLocaleString('en-US')} px per side and ${Math.round(CANVAS_MAX_AREA / 1e6)} megapixels in total; a larger size is refused before drawing` },
          { label: 'On iPhone and iPad', value: `The same numbers are accepted, but the result is assembled in memory at four bytes per pixel, so a very large PNG can exceed what Safari gives a page` }
        ]}
        privacy={`The SVG is loaded as an image by your browser and painted onto a canvas here, so the drawing is not uploaded. If drawing or encoding the PNG fails, the cleaned error, the tool's name and your browser's name and version are sent to our error log; the SVG and its name are not included.`}
        faqs={[
          { q: "Can I set a DPI for printing?", a: `No. The size is set in pixels. For print, multiply the printed width in inches by the dots per inch you need and type the result in "Width (px)".` },
          { q: "Will the PNG keep the transparent background?", a: `Yes, when "Transparent" is selected under "Background", which is the starting choice. Select "Colour" to fill the transparent parts, for example with white for a document.` },
          { q: "Can I change the width without changing the height?", a: `Yes. Untick "Keep the SVG's proportions", then type both values; the drawing is stretched to fill them. With the box ticked, one side follows the other.` }
        ]}
        tips={[
          `For a favicon, convert the SVG to a square PNG at the largest icon size you need here, then build the icon with PNG to ICO.`
        ]}
      />
    </div>
  );
}