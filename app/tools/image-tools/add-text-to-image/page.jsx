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
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

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
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Text (Enter for a new line)</label><TextArea aria-label="Text" rows={2} value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
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
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Add Text to Image"
        description={"Add Text to Image writes your words on a picture: a caption, a meme line, a date or a simple watermark. The text can run over several lines (press Enter) and is centered on a point you place with the X and Y sliders. You choose one of six fonts, bold or italic, a size measured in pixels of the full photo, a color, the opacity, a rotation, an outline with its own color, and a soft drop shadow. There is one block of text per image: clicking again replaces it instead of adding a second one. The text is drawn in your browser with the fonts on your device."}
        howToTitle={"How to add text to a photo"}
        howTo={[
          "Click the upload box and choose the photo you want to caption.",
          "Type in \"Text (Enter for a new line)\", then pick a \"Font\", a \"Color\" and a \"Font Size\" (10 to 800 px, measured on the full-size photo).",
          "Place the text with \"X Position\" and \"Y Position\", and set \"Opacity\", \"Rotation\", \"Outline\" or \"Shadow\" if you want them.",
          "Click \"Apply Text\", check the preview, then click \"Download\"; JPG, PNG and WebP keep their format, any other photo comes back as PNG.",
        ]}
        specs={[
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF and other pictures the browser can display" },
          { label: "Output format", value: "The format of the photo for JPG, PNG and WebP; PNG for other formats" },
          { label: "Fonts", value: "Arial / Helvetica, Impact, Georgia / Times, Courier, Verdana, Comic Sans; a font your device lacks is replaced by a similar one" },
          { label: "Text settings", value: "Size 10 to 800 px, opacity 10 to 100 percent, rotation from −180° to 180°, outline 0 to 30 px, optional shadow" },
          { label: "Photo size", value: "Photos of up to 268 megapixels" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"Your words are drawn onto the photo by this page, with fonts already installed on your device, and neither the photo nor the text is uploaded. The captioned image stays in the tab until you download it. If an error appears, we receive the error message cleaned of any quoted text, the tool's name and the browser's name and version, to track down the problem."}
        faqs={[
          { q: "Can I write several lines?", a: "Yes. Press Enter in the text box to start a new line. The lines are centered on the X/Y point, one under the other, spaced at 1.2 times the font size, and the outline and shadow apply to every line." },
          { q: "Can I add two separate text boxes?", a: "No. There is one block of text per image. Clicking \"Apply Text\" again redraws your current text on the original photo; it does not stack a second layer. For a second caption, download the result, load it again and add the next text." },
          { q: "Is the font size measured on the preview?", a: "No. It is counted in pixels of the full photo, so on a large phone photo the default size looks small. Raise \"Font Size\" (up to 800 px) and click \"Apply Text\" again to check." },
          { q: "Can I make a classic meme caption?", a: "Yes. Choose \"Impact (memes)\", keep a white \"Color\", raise \"Outline\" a few pixels with a black \"Outline colour\", and move \"Y Position\" near the top or the bottom. Bold is already on by default." },
        ]}
        tips={[
          "The settings stay in place when you load another photo, so you can put the same caption on several pictures one after the other.",
          "Lower \"Opacity\" for a discreet watermark that does not hide the picture.",
        ]}
      />
    </div>
  );
}