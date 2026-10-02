'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';

// P24 (03/10): iLoveIMG's text (watermark / meme) offers fonts, size, colour, shadow, opacity; ezgif adds outline and
// rotation. Fonts are system stacks with fallbacks (a font missing on the device falls back to a similar one).
const FONTS = [
  ['Arial, Helvetica, "Liberation Sans", sans-serif', 'Arial / Helvetica'],
  ['Impact, Haettenschweiler, "Arial Narrow Bold", "Liberation Sans Narrow", sans-serif', 'Impact (memes)'],
  ['Georgia, "Times New Roman", "Liberation Serif", serif', 'Georgia / Times (serif)'],
  ['"Courier New", Courier, "Liberation Mono", monospace', 'Courier (typewriter)'],
  ['Verdana, Geneva, "DejaVu Sans", sans-serif', 'Verdana'],
  ['"Comic Sans MS", "Comic Neue", "Chalkboard SE", cursive', 'Comic Sans'],
];
export default function AddTextToImagePage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [text, setText] = useState('Hello World');
  const [fontSize, setFontSize] = useState(40);
  const [color, setColor] = useState('#ffffff');
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [font, setFont] = useState(FONTS[0][0]);
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [angle, setAngle] = useState(0);
  const [outline, setOutline] = useState(0);
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [shadow, setShadow] = useState(false);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type);
    setResult(null);
    setError('');
  };

  const apply = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const W = raster.width, H = raster.height;
      const out = await renderFull(raster, W, H, (ctx, drawSource) => {
        drawSource(ctx);
        ctx.save();
        ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px ${font}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = opacity;
        ctx.translate(W * posX / 100, H * posY / 100);
        ctx.rotate((angle * Math.PI) / 180);
        if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = fontSize / 8; ctx.shadowOffsetX = ctx.shadowOffsetY = fontSize / 16; }
        // several lines, centred on the chosen point
        const lines = text.split(/\r?\n/), lh = fontSize * 1.2, top = -((lines.length - 1) * lh) / 2;
        const shadowColor = ctx.shadowColor;
        lines.forEach((ln, k) => {
          // the shadow is cast by the outline when there is one (not twice), on every line
          ctx.shadowColor = shadowColor;
          if (outline > 0) { ctx.lineJoin = 'round'; ctx.lineWidth = outline * 2; ctx.strokeStyle = outlineColor; ctx.strokeText(ln, 0, top + k * lh); ctx.shadowColor = 'transparent'; }
          ctx.fillStyle = color; ctx.fillText(ln, 0, top + k * lh);
        });
        ctx.restore();
      });
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'text'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Add Text to Image</h1>
        <p className="text-neutral-500 text-center mb-8">Overlay text on images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Text (Enter for a new line)</label><textarea aria-label="Text" rows={2} value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Font Size: {fontSize}px</label><input aria-label="Font Size (px)" type="range" min="10" max="800" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Color</label><input aria-label="Color" type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">X Position: {posX}%</label><input aria-label="X Position (%)" type="range" min="0" max="100" value={posX} onChange={e => setPosX(parseInt(e.target.value))} className="w-full" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Y Position: {posY}%</label><input aria-label="Y Position (%)" type="range" min="0" max="100" value={posY} onChange={e => setPosY(parseInt(e.target.value))} className="w-full" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Font</span>
              <select id="tx-font" value={font} onChange={e => setFont(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">{FONTS.map(([v, l]) => <option key={l} value={v}>{l}</option>)}</select></label>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2"><input id="tx-bold" type="checkbox" checked={bold} onChange={e => setBold(e.target.checked)} /> Bold</label>
              <label className="flex items-center gap-2"><input id="tx-italic" type="checkbox" checked={italic} onChange={e => setItalic(e.target.checked)} /> Italic</label>
              <label className="flex items-center gap-2"><input id="tx-shadow" type="checkbox" checked={shadow} onChange={e => setShadow(e.target.checked)} /> Shadow</label>
            </div>
            <label className="block"><span className="block text-neutral-500 mb-1">Opacity: {Math.round(opacity * 100)}%</span><input id="tx-opacity" aria-label="Opacity (%)" type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full" /></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Rotation: {angle}°</span><input id="tx-angle" aria-label="Rotation (degrees)" type="range" min="-180" max="180" value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full" /></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Outline: {outline}px</span><input id="tx-outline" aria-label="Outline (px)" type="range" min="0" max="30" value={outline} onChange={e => setOutline(Number(e.target.value))} className="w-full" /></label>
            {outline > 0 && <label className="flex items-center gap-2"><span className="text-neutral-500">Outline colour</span><input id="tx-outline-color" type="color" value={outlineColor} onChange={e => setOutlineColor(e.target.value)} /></label>}
          </div>
          <button onClick={apply} disabled={!image || !text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Apply Text</button>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Add Text to Image"
        description="Add Text to Image overlays text — one or several lines — onto your photo, entirely in your browser. Type your message; choose the font (Arial, Impact for memes, Georgia, Courier, Verdana, Comic Sans), bold or italic, size, colour, opacity, rotation, an outline and a shadow; and position it with the X/Y sliders — no design skills or software installation needed, and nothing is uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Type your text (Enter for a new line), then set the font, size, color, opacity, rotation, outline or shadow.",
          "Use the X and Y position sliders to place the text where you want it.",
          "Click 'Apply Text' and then the download button to save your image."
        ]}
        faqs={[
          { q: "What image formats are supported?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The result keeps your image's format: a JPG stays a JPG, a PNG stays a PNG (transparency included), a WebP stays a WebP." },
          { q: "Can I add multiple text boxes to a single image?", a: "No, only one text overlay is supported at a time — clicking Apply again re-applies your current text to the original image rather than stacking a second layer." },
          { q: "Can I choose a different font or add a shadow?", a: "Yes: six fonts (a font your device lacks is replaced by a similar one), bold and italic, a shadow, an outline of any colour and width, the opacity and a rotation." },
          { q: "Do I need to create an account to use this tool?", a: "No, it's completely free with no account or login required." }
        ]}
        tips={[
          "Use a color that contrasts clearly with your image so the text stays readable.",
          "Preview a few font sizes to find one that fits your image without running off the edges.",
          "For a meme, choose Impact, white text with a black outline of 4 to 8 px.",
          "Since nothing is uploaded, download your result promptly — it isn't saved anywhere after you leave the page."
        ]}
      />
    </div>
  );
}