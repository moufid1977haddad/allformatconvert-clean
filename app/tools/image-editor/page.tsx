'use client';
import { useState, useRef, useCallback } from 'react';

export default function ImageEditorPage() {
  const [image, setImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [activeTab, setActiveTab] = useState('adjust');
  const canvasRef = useRef(null);
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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setImage(event.target?.result);
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
        }
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

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
      ctx.roundRect(0, 0, width, height, cornerRadius);
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
      ctx.font = textSize + 'px Arial';
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
    applyEffects();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Editeur d&apos;images complet</h1>
      <p className="text-neutral-400 mb-6">Retouchez vos images avec de nombreux effets</p>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-neutral-900 rounded-xl p-4">
            <label className="block text-sm font-medium mb-2">Charger une image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveTab('adjust')} className={(activeTab === 'adjust' ? 'bg-indigo-600' : 'bg-neutral-800') + ' px-4 py-2 rounded-lg transition'}>Ajuster</button>
            <button onClick={() => setActiveTab('transform')} className={(activeTab === 'transform' ? 'bg-indigo-600' : 'bg-neutral-800') + ' px-4 py-2 rounded-lg transition'}>Transformer</button>
            <button onClick={() => setActiveTab('effects')} className={(activeTab === 'effects' ? 'bg-indigo-600' : 'bg-neutral-800') + ' px-4 py-2 rounded-lg transition'}>Effets</button>
            <button onClick={() => setActiveTab('decorate')} className={(activeTab === 'decorate' ? 'bg-indigo-600' : 'bg-neutral-800') + ' px-4 py-2 rounded-lg transition'}>Decorater</button>
          </div>
          <div className="bg-neutral-900 rounded-xl p-4 space-y-3">
            {activeTab === 'adjust' && (
              <>
                <div><label>Luminosite ({brightness})</label><input type="range" min="-100" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full" /></div>
                <div><label>Contraste ({contrast})</label><input type="range" min="-100" max="100" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} className="w-full" /></div>
                <div><label>Saturation ({saturation})</label><input type="range" min="-100" max="100" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} className="w-full" /></div>
                <div><label>Niveaux de gris</label><input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} /></div>
                <div><label>Inverser couleurs</label><input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} /></div>
              </>
            )}
            {activeTab === 'transform' && (
              <>
                <div><label>Rotation ({rotation}deg)</label><input type="range" min="0" max="360" step="90" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full" /></div>
                <div><label>Miroir horizontal</label><input type="checkbox" checked={flipH} onChange={(e) => setFlipH(e.target.checked)} /></div>
                <div><label>Miroir vertical</label><input type="checkbox" checked={flipV} onChange={(e) => setFlipV(e.target.checked)} /></div>
                <div><label>Pixelisation ({pixelSize}px)</label><input type="range" min="0" max="20" value={pixelSize} onChange={(e) => setPixelSize(parseInt(e.target.value))} className="w-full" /></div>
              </>
            )}
            {activeTab === 'effects' && (
              <>
                <div><label>Bruit / Grain ({noiseIntensity})</label><input type="range" min="0" max="50" value={noiseIntensity} onChange={(e) => setNoiseIntensity(parseInt(e.target.value))} className="w-full" /></div>
                <div><label>Vignette ({vignetteStrength}%)</label><input type="range" min="0" max="100" value={vignetteStrength} onChange={(e) => setVignetteStrength(parseInt(e.target.value))} className="w-full" /></div>
              </>
            )}
            {activeTab === 'decorate' && (
              <>
                <div><label>Coins arrondis ({cornerRadius}px)</label><input type="range" min="0" max="100" value={cornerRadius} onChange={(e) => setCornerRadius(parseInt(e.target.value))} className="w-full" /></div>
                <div><label>Bordure ({borderWidth}px)</label><input type="range" min="0" max="20" value={borderWidth} onChange={(e) => setBorderWidth(parseInt(e.target.value))} className="w-full" /></div>
                <div><label>Couleur bordure</label><input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-full h-10" /></div>
                <div><label>Texte</label><input type="text" value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} placeholder="Votre texte" className="w-full bg-neutral-800 rounded p-2" /></div>
                <div><label>Couleur texte</label><input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10" /></div>
                <div><label>Taille texte ({textSize}px)</label><input type="range" min="12" max="72" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="w-full" /></div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={applyEffects} className="flex-1 bg-indigo-600 py-2 rounded-lg hover:bg-indigo-500">Appliquer</button>
              <button onClick={resetAll} className="flex-1 bg-neutral-800 py-2 rounded-lg hover:bg-neutral-700">Reinitialiser</button>
              {image && <button onClick={downloadImage} className="flex-1 bg-green-600 py-2 rounded-lg hover:bg-green-500">Telecharger</button>}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-neutral-900 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Apercu</h3>
            {image ? (
              <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg mx-auto"></canvas>
            ) : (
              <div className="text-center text-neutral-500 py-20">Chargez une image pour commencer</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
