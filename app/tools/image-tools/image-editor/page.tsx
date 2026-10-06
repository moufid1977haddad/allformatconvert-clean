'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { pixelateImageData, roundedRectPath, encodeRaster, encodeRasterLike, sourceTypeOf } from '../../../lib/imageOutput';
import { CANVAS_MAX_PIXELS, canvasBeyondSafariCap, rasterFromCanvas, rasterFromRGBA } from '../../../lib/bigImage';
import { derivedName } from '../../../lib/download';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function ImageEditorPage() {
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState('adjust');
  const [srcType, setSrcType] = useState('image/png');
  const [file, setFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useToolError('');
  const [loadError, setLoadError] = useToolError('');
  // The full-size edited photo, made when the visitor asks (Save image) and offered through the site's download row.
  const [exported, setExported] = useState<{ blob: Blob; name: string } | null>(null);
  const alertError = (m: string) => setSaveError(m);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [invert, setInvert] = useState(false);
  const [cornerRadius, setCornerRadius] = useState(0);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState('#4f46e5');
  const [textOverlay, setTextOverlay] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [pixelSize, setPixelSize] = useState(0);
  const [noiseIntensity, setNoiseIntensity] = useState(0);
  const [vignetteStrength, setVignetteStrength] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaveError('');
    setLoadError('');
    e.target.value = '';
    // P21 (robustness): an empty, damaged or unreadable file, or a picture too large to edit, was ignored without a
    // word (the upload area simply stayed empty).
    if (!file.size) { setLoadError('This file is empty (0 bytes). Choose the image again.'); return; }
    // An object URL, not a data: URL: a phone photo is not copied into a string of tens of MB.
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth * img.naturalHeight > 100_000_000) {
        setLoadError(`This image is ${img.naturalWidth} × ${img.naturalHeight} pixels: too large to edit here (100 megapixels at most). Make it smaller first with our Image Resizer.`);
        URL.revokeObjectURL(url);
        return;
      }
      // the file and its type are taken only once the picture is known to be usable (review, 02/10)
      setSrcType(file.type);
      setFile(file);
      setOriginalImage(img);
      setImage(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); setLoadError(`"${file.name}" is not an image this browser can open (it may be damaged, or another kind of file). Choose a JPG, PNG, WebP or GIF image.`); };
    img.src = url;
  };

  // canvasRef.current only exists after this render commits (the <canvas> mounts once `image` is set): the first
  // preview is drawn here, and again after Reset once the reset values have flushed.
  const [redraw, setRedraw] = useState(0);
  useEffect(() => {
    if (originalImage && canvasRef.current) applyEffects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImage, redraw]);

  // 30/09 (owner's iPhone): the editor drew the photo on ONE canvas at full size, which iOS refuses past 16.7 MP
  // (every 24/48 MP iPhone photo), and saved it as a data: link, which iOS does not save. The effects are now painted
  // by paint() on any horizontal band of the result at any scale k: the page shows a preview (scaled down when the
  // photo is too big for one canvas here), and "Save image" repaints the full-size photo band by band (lib/imageOutput.js
  // pipeline), in the photo's own format, as a Blob named after it.
  const paint = useCallback((ctx: CanvasRenderingContext2D, img: HTMLImageElement, k: number, bandY: number, bandH: number) => {
    const rot = ((rotation % 360) + 360) % 360;
    const swap = rot === 90 || rot === 270;
    const W = swap ? img.height : img.width, H = swap ? img.width : img.height; // full-size result
    const w = Math.round(W * k); // this rendering's width
    const toFull = () => ctx.setTransform(k, 0, 0, k, 0, -bandY); // full-size coordinates, shifted to the band
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, bandH);
    toFull();
    ctx.translate(W / 2, H / 2);
    // A 90 or 270 degree rotation swaps the sides: the canvas used to keep the original size, so a rotated landscape
    // photo was cut off (29/09).
    if (rot !== 0) ctx.rotate((rot * Math.PI) / 180);
    if (flipH || flipV) ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, bandH);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      r += brightness;
      g += brightness;
      b += brightness;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;
      if (saturation !== 0) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        const satFactor = 1 + saturation / 100;
        r = gray + (r - gray) * satFactor;
        g = gray + (g - gray) * satFactor;
        b = gray + (b - gray) * satFactor;
      }
      if (grayscale) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = g = b = gray;
      }
      if (invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }
      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
    // Block average, as the Image Pixelator (it used to copy the top-left pixel, 29/09). Bands start on a block edge.
    const block = pixelSize > 1 ? Math.max(1, Math.round(pixelSize * k)) : 0;
    if (block > 1) pixelateImageData(imageData, block);
    if (noiseIntensity > 0) {
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * noiseIntensity;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
    }
    if (vignetteStrength > 0) {
      const cx = (W * k) / 2, cy = (H * k) / 2, maxDist = Math.sqrt(cx * cx + cy * cy);
      for (let y = 0; y < bandH; y++) {
        for (let x = 0; x < w; x++) {
          const dist = Math.sqrt((x - cx) ** 2 + (y + bandY - cy) ** 2);
          const f = 1 - (dist / maxDist) * (vignetteStrength / 100);
          const idx = (y * w + x) * 4;
          data[idx] = Math.min(255, data[idx] * f);
          data[idx + 1] = Math.min(255, data[idx + 1] * f);
          data[idx + 2] = Math.min(255, data[idx + 2] * f);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    toFull();
    if (cornerRadius > 0) {
      // Keep only the rounded rectangle: drawing the canvas onto itself inside a
      // clip (the previous code) erased nothing, so the corners stayed square (29/09).
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      roundedRectPath(ctx, 0, 0, W, H, cornerRadius);
      ctx.fill();
      ctx.restore();
    }
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, W - borderWidth, H - borderWidth);
    }
    if (textOverlay.trim()) {
      ctx.font = `${textSize}px Arial`;
      ctx.fillStyle = textColor;
      ctx.fillText(textOverlay, 20, textSize + 20);
    }
    ctx.restore();
    return { W, H };
  }, [brightness, contrast, saturation, grayscale, invert, rotation, flipH, flipV, cornerRadius, borderWidth, borderColor, pixelSize, noiseIntensity, vignetteStrength, textOverlay, textColor, textSize]);

  // The preview: full size when one canvas can hold the photo here, else scaled down to fit (iPhone, 24/48 MP).
  const applyEffects = useCallback(async () => {
    if (!originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const rot = ((rotation % 360) + 360) % 360, swap = rot === 90 || rot === 270;
    const W = swap ? originalImage.height : originalImage.width, H = swap ? originalImage.width : originalImage.height;
    const fits = W * H <= CANVAS_MAX_PIXELS || (await canvasBeyondSafariCap());
    const k = fits ? 1 : Math.sqrt((CANVAS_MAX_PIXELS * 0.9) / (W * H));
    canvas.width = Math.round(W * k);
    canvas.height = Math.round(H * k);
    paint(ctx, originalImage, k, 0, canvas.height);
  }, [originalImage, rotation, paint]);

  // Any change to the edit makes the saved file out of date: it is taken off the page.
  useEffect(() => { setExported(null); }, [paint, rotation, cornerRadius, originalImage]);

  const downloadImage = async () => {
    if (!originalImage || !canvasRef.current || !file) return;
    try {
      const rot = ((rotation % 360) + 360) % 360, swap = rot === 90 || rot === 270;
      const W = swap ? originalImage.height : originalImage.width, H = swap ? originalImage.width : originalImage.height;
      let out;
      if (canvasRef.current.width === W && canvasRef.current.height === H) out = rasterFromCanvas(canvasRef.current, W, H);
      else {
        // Full size, band by band; a band starts on a pixelation block edge so blocks are never cut.
        const blk = pixelSize > 1 ? pixelSize : 1;
        const step = Math.max(blk, Math.floor(Math.floor(CANVAS_MAX_PIXELS / W) / blk) * blk);
        const rgba = new Uint8ClampedArray(W * H * 4);
        const c = document.createElement('canvas'); c.width = W; c.height = step;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('This device could not prepare the image.');
        for (let y = 0; y < H; y += step) {
          const h = Math.min(step, H - y);
          paint(ctx, originalImage, 1, y, h);
          rgba.set(ctx.getImageData(0, 0, W, h).data, y * W * 4);
        }
        c.width = 1;
        out = rasterFromRGBA(rgba, W, H);
      }
      // The photo's own format (JPG stays JPG), except when the corners were made transparent, which needs PNG.
      const blob = cornerRadius > 0 ? await encodeRaster(out, 'image/png') : await encodeRasterLike(out, sourceTypeOf(file));
      setExported({ blob, name: derivedName(file.name, 'edited', blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png') });
    } catch (e: any) {
      alertError(e?.message || 'The image could not be saved.');
    }
  };

  const resetAll = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setGrayscale(false);
    setInvert(false);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCornerRadius(0);
    setBorderWidth(0);
    setPixelSize(0);
    setNoiseIntensity(0);
    setVignetteStrength(0);
    setTextOverlay('');
    setRedraw((n) => n + 1);
  };

  const tabs = [
    { key: 'adjust', label: 'Adjust' },
    { key: 'transform', label: 'Transform' },
    { key: 'effects', label: 'Effects' },
    { key: 'decorate', label: 'Decorate' },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Editor</h1>
        <p className="text-neutral-500 text-center mb-8">Adjust, transform, and decorate your images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current?.click()}>
            {image ? (
              <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg mx-auto"></canvas>
            ) : (
              <p className="text-neutral-500"><UploadPrompt what="an image" /></p>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          {loadError && <p role="alert" className="text-red-600 text-center text-sm">{loadError}</p>}

          {image && (
            <>
              <div className="flex gap-2 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={(activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800') + ' px-4 py-2 rounded-lg text-sm font-semibold transition'}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {activeTab === 'adjust' && (
                  <>
                    <div><label className="block text-sm text-neutral-500 mb-1">Brightness ({brightness})</label><input aria-label="Brightness" type="range" min="-100" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Contrast ({contrast})</label><input aria-label="Contrast" type="range" min="-100" max="100" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Saturation ({saturation})</label><input aria-label="Saturation" type="range" min="-100" max="100" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} className="w-full" /></div>
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} />Grayscale</label>
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />Invert Colors</label>
                  </>
                )}
                {activeTab === 'transform' && (
                  <>
                    <div><label className="block text-sm text-neutral-500 mb-1">Rotation ({rotation}&deg;)</label><input aria-label="Rotation" type="range" min="0" max="360" step="90" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full" /></div>
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={flipH} onChange={(e) => setFlipH(e.target.checked)} />Flip Horizontal</label>
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={flipV} onChange={(e) => setFlipV(e.target.checked)} />Flip Vertical</label>
                    <div><label className="block text-sm text-neutral-500 mb-1">Pixelate ({pixelSize}px)</label><input aria-label="Pixelate" type="range" min="0" max="20" value={pixelSize} onChange={(e) => setPixelSize(parseInt(e.target.value))} className="w-full" /></div>
                  </>
                )}
                {activeTab === 'effects' && (
                  <>
                    <div><label className="block text-sm text-neutral-500 mb-1">Noise / Grain ({noiseIntensity})</label><input type="range" min="0" max="50" value={noiseIntensity} onChange={(e) => setNoiseIntensity(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Vignette ({vignetteStrength}%)</label><input aria-label="Vignette" type="range" min="0" max="100" value={vignetteStrength} onChange={(e) => setVignetteStrength(parseInt(e.target.value))} className="w-full" /></div>
                  </>
                )}
                {activeTab === 'decorate' && (
                  <>
                    <div><label className="block text-sm text-neutral-500 mb-1">Corner Radius ({cornerRadius}px)</label><input aria-label="Corner Radius" type="range" min="0" max="100" value={cornerRadius} onChange={(e) => setCornerRadius(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Border Width ({borderWidth}px)</label><input aria-label="Border Width" type="range" min="0" max="20" value={borderWidth} onChange={(e) => setBorderWidth(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Border Color</label><input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-full h-10" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Text</label><input type="text" value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} placeholder="Your text" className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-neutral-800" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Text Color</label><input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Text Size ({textSize}px)</label><input aria-label="Text Size" type="range" min="12" max="72" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="w-full" /></div>
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={applyEffects} className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition text-white">Apply</button>
                <button onClick={resetAll} className="flex-1 bg-neutral-800 text-neutral-100 hover:bg-neutral-700 rounded-xl py-3 font-semibold transition">Reset</button>
                <button onClick={downloadImage} className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl py-3 font-semibold transition text-white">Save image</button>
              </div>
              {saveError && <p role="alert" className="text-red-500 text-center text-sm">{saveError}</p>}
              {exported && <FileDownload blob={exported.blob} name={exported.name} note="full size" />}
            </>
          )}
        </div>
      </div>
      <SeoContent
        title="Image Editor"
        description={"Image Editor gathers simple edits on one canvas so you can combine them before saving. Four tabs hold the controls: Adjust (brightness, contrast, saturation, grayscale, invert), Transform (rotation in quarter turns, horizontal and vertical flip, pixelate), Effects (grain, vignette) and Decorate (rounded corners, border, one line of text). Apply refreshes the preview; Save image renders the full-size result: JPG, PNG and WebP photos keep their format, while other formats and any picture with rounded corners are saved as PNG. There is no crop, blur, sepia or undo history; the single-purpose tools cover those. Editing happens in your browser."}
        howToTitle={"How to edit a photo in the browser"}
        howTo={[
          "Click the upload box and choose a photo; it appears on the canvas.",
          "Open the \"Adjust\", \"Transform\", \"Effects\" and \"Decorate\" tabs and set the sliders and boxes you need.",
          "Click \"Apply\" to redraw the preview with all the settings, or \"Reset\" to clear them.",
          "Click \"Save image\", then \"Download\" in the row that appears; on iPhone and iPad, \"Save / Share\" opens the share sheet.",
        ]}
        specs={[
          { label: "Adjust", value: "Brightness, Contrast, Saturation from −100 to 100; Grayscale; Invert Colors" },
          { label: "Transform", value: "Rotation 0, 90, 180 or 270 degrees; Flip Horizontal; Flip Vertical; Pixelate 0 to 20 px" },
          { label: "Effects and Decorate", value: "Grain 0 to 50, Vignette 0 to 100; Corner Radius 0 to 100 px; Border Width 0 to 20 px, inside the picture; text in Arial, 12 to 72 px, at the top left" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF or another picture the browser displays, up to 100 megapixels" },
          { label: "Output format", value: "JPG (quality 92), PNG and WebP keep their format; GIF, BMP and other formats, and any result with Corner Radius above 0, are saved as PNG" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"Every edit is painted by this page on a canvas in your browser, and the photo is not uploaded at any step. The saved image is made in the tab when you click Save image and is lost if you close the tab without downloading it. Should the editor show an error, its cleaned message travels to us with the tool's name and your browser's name and version; the photo stays out of it."}
        faqs={[
          { q: "Can I crop or blur in Image Editor?", a: "No. There is no crop, blur or sepia control here. Use Image Cropper, Image Blur or Sepia Filter, then load the result into the editor if you want to add other changes." },
          { q: "Do changes show while I move a slider?", a: "No. The preview is redrawn when you click \"Apply\". Click \"Apply\" before \"Save image\" as well, so that the preview shows what you save. A slider or box you change afterwards takes effect at the next click." },
          { q: "Is the saved image full size?", a: "Yes. It has the full pixel size of your photo, turned if you rotated it. JPG, PNG and WebP keep their format; GIF, BMP and other formats, and any result with \"Corner Radius\" above 0, are saved as PNG, because rounded corners need transparency." },
          { q: "Can I rotate by any angle?", a: "No. The \"Rotation\" slider moves in steps of 90 degrees. For a slight tilt, use Image Rotate, which accepts any angle and fills the corners with transparency or a color." },
          { q: "Does it handle big iPhone photos?", a: "Yes, up to 100 megapixels. On iPhone and iPad, a photo above 16.7 megapixels is previewed scaled down, and \"Save image\" rebuilds the full-size result strip by strip with the current settings." },
        ]}
        tips={[
          "A border and rounded corners do not combine well here, as the border stays square over the rounded corners: use Add Border to Image first, then Round Corners.",
          "\"Reset\" clears every setting without reloading the photo.",
        ]}
      />
    </div>
  );
}