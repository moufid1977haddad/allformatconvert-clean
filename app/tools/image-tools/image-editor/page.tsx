'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function ImageEditorPage() {
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState('adjust');
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
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setImage(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    // canvasRef.current is only guaranteed to exist after this render commits
    // (the <canvas> element only mounts once `image` is set), so the initial
    // draw must happen here rather than inline in handleImageUpload's
    // img.onload — otherwise the very first upload silently fails to draw
    // since the ref is still null at that point.
    if (!originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(originalImage, 0, 0);
  }, [originalImage]);

  const applyEffects = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = originalImage;
    let width = img.width;
    let height = img.height;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    if (rotation !== 0) {
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-width / 2, -height / 2);
    }
    if (flipH || flipV) {
      ctx.translate(flipH ? width : 0, flipV ? height : 0);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
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
    ctx.putImageData(imageData, 0, 0);
    if (pixelSize > 1) {
      const newData = ctx.getImageData(0, 0, width, height);
      for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
          const idx = (y * width + x) * 4;
          const r = newData.data[idx];
          const g = newData.data[idx + 1];
          const b = newData.data[idx + 2];
          for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
            for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
              const id = ((y + dy) * width + (x + dx)) * 4;
              newData.data[id] = r;
              newData.data[id + 1] = g;
              newData.data[id + 2] = b;
            }
          }
        }
      }
      ctx.putImageData(newData, 0, 0);
    }
    if (noiseIntensity > 0) {
      const noiseData = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < noiseData.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * noiseIntensity;
        noiseData.data[i] = Math.min(255, Math.max(0, noiseData.data[i] + noise));
        noiseData.data[i + 1] = Math.min(255, Math.max(0, noiseData.data[i + 1] + noise));
        noiseData.data[i + 2] = Math.min(255, Math.max(0, noiseData.data[i + 2] + noise));
      }
      ctx.putImageData(noiseData, 0, 0);
    }
    ctx.restore();
    if (cornerRadius > 0) {
      ctx.save();
      ctx.beginPath();
      (ctx as any).roundRect(0, 0, width, height, cornerRadius);
      ctx.clip();
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    }
    if (borderWidth > 0) {
      ctx.save();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
      ctx.restore();
    }
    if (vignetteStrength > 0) {
      const vignData = ctx.getImageData(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          const factor = 1 - (dist / maxDist) * (vignetteStrength / 100);
          const idx = (y * width + x) * 4;
          vignData.data[idx] = Math.min(255, vignData.data[idx] * factor);
          vignData.data[idx + 1] = Math.min(255, vignData.data[idx + 1] * factor);
          vignData.data[idx + 2] = Math.min(255, vignData.data[idx + 2] * factor);
        }
      }
      ctx.putImageData(vignData, 0, 0);
    }
    if (textOverlay.trim()) {
      ctx.save();
      ctx.font = `${textSize}px Arial`;
      ctx.fillStyle = textColor;
      ctx.fillText(textOverlay, 20, textSize + 20);
      ctx.restore();
    }
  }, [originalImage, brightness, contrast, saturation, grayscale, invert, rotation, flipH, flipV, cornerRadius, borderWidth, borderColor, pixelSize, noiseIntensity, vignetteStrength, textOverlay, textColor, textSize]);

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
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
    // Redraw directly from originalImage instead of calling applyEffects():
    // applyEffects is a useCallback closed over the pre-reset state values,
    // and the setState calls above haven't flushed yet, so calling it here
    // would repaint with the OLD effect values instead of the reset ones.
    const canvas = canvasRef.current;
    if (canvas && originalImage) {
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(originalImage, 0, 0);
    }
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
              <p className="text-neutral-500">Click or drop an image here</p>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

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
                    <div><label className="block text-sm text-neutral-500 mb-1">Brightness ({brightness})</label><input type="range" min="-100" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Contrast ({contrast})</label><input type="range" min="-100" max="100" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Saturation ({saturation})</label><input type="range" min="-100" max="100" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} className="w-full" /></div>
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} />Grayscale</label>
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />Invert Colors</label>
                  </>
                )}
                {activeTab === 'transform' && (
                  <>
                    <div><label className="block text-sm text-neutral-500 mb-1">Rotation ({rotation}&deg;)</label><input type="range" min="0" max="360" step="90" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full" /></div>
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={flipH} onChange={(e) => setFlipH(e.target.checked)} />Flip Horizontal</label>
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={flipV} onChange={(e) => setFlipV(e.target.checked)} />Flip Vertical</label>
                    <div><label className="block text-sm text-neutral-500 mb-1">Pixelate ({pixelSize}px)</label><input type="range" min="0" max="20" value={pixelSize} onChange={(e) => setPixelSize(parseInt(e.target.value))} className="w-full" /></div>
                  </>
                )}
                {activeTab === 'effects' && (
                  <>
                    <div><label className="block text-sm text-neutral-500 mb-1">Noise / Grain ({noiseIntensity})</label><input type="range" min="0" max="50" value={noiseIntensity} onChange={(e) => setNoiseIntensity(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Vignette ({vignetteStrength}%)</label><input type="range" min="0" max="100" value={vignetteStrength} onChange={(e) => setVignetteStrength(parseInt(e.target.value))} className="w-full" /></div>
                  </>
                )}
                {activeTab === 'decorate' && (
                  <>
                    <div><label className="block text-sm text-neutral-500 mb-1">Corner Radius ({cornerRadius}px)</label><input type="range" min="0" max="100" value={cornerRadius} onChange={(e) => setCornerRadius(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Border Width ({borderWidth}px)</label><input type="range" min="0" max="20" value={borderWidth} onChange={(e) => setBorderWidth(parseInt(e.target.value))} className="w-full" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Border Color</label><input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-full h-10" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Text</label><input type="text" value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} placeholder="Your text" className="w-full bg-neutral-50 border border-neutral-200 rounded p-2 text-neutral-800" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Text Color</label><input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10" /></div>
                    <div><label className="block text-sm text-neutral-500 mb-1">Text Size ({textSize}px)</label><input type="range" min="12" max="72" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="w-full" /></div>
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={applyEffects} className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Apply</button>
                <button onClick={resetAll} className="flex-1 bg-neutral-800 text-neutral-100 hover:bg-neutral-700 rounded-xl py-3 font-semibold transition">Reset</button>
                <button onClick={downloadImage} className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl py-3 font-semibold transition">Download</button>
              </div>
            </>
          )}
        </div>
      </div>
      <SeoContent
        title="Image Editor"
        description="Image Editor is a free, full-featured photo editor that runs entirely in your browser — no upload, no signup, and no software to install. Adjust colors, transform and crop, apply creative effects like pixelation and vignette, and decorate your image with borders and text, then download the result as a PNG."
        howTo={[
          "Upload an image from your device to load it into the canvas editor.",
          "Use the Adjust, Transform, Effects, and Decorate tabs to tweak brightness, contrast, saturation, rotation, flips, pixelation, noise, vignette, borders, and text.",
          "Click \"Apply\" to render your changes onto the preview.",
          "Click \"Download\" to save the edited image as a PNG once you're happy with the result."
        ]}
        faqs={[
          { q: "Is Image Editor free to use?", a: "Yes, it's completely free with no signup and no limit on how many images you can edit." },
          { q: "Is my image uploaded to a server?", a: "No. All editing happens locally in your browser using the Canvas API — your image never leaves your device." },
          { q: "What kinds of edits can I make?", a: "Color adjustments (brightness, contrast, saturation, grayscale, invert), transforms (rotate, flip, pixelate), effects (noise/grain, vignette), and decorations (rounded corners, borders, text overlay)." },
          { q: "What format can I download my edited image in?", a: "Edited images are downloaded as PNG files." }
        ]}
        tips={[
          "Changes only appear after you click \"Apply\" — adjusting a slider or checkbox doesn't update the preview until you do.",
          "Use \"Reset\" to clear every adjustment and start over without re-uploading the image.",
          "Combine desaturation with a vignette for a quick vintage or moody look.",
          "Rounded corners and a border are a fast way to turn a photo into a ready-to-use avatar or card image."
        ]}
      />
    </div>
  );
}