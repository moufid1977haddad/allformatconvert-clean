const fs = require('fs');
const path = require('path');

const tools = {
  'image-compressor': 'Image Compressor',
  'image-resizer': 'Image Resizer',
  'image-cropper': 'Image Cropper',
  'image-rotate': 'Image Rotate',
  'image-flip': 'Image Flip',
  'round-corners': 'Round Corners',
  'add-text-to-image': 'Add Text to Image',
  'add-border-to-image': 'Add Border to Image',
  'brightness-contrast': 'Brightness and Contrast',
  'image-comparison': 'Image Comparison',
  'duplicate-image-finder': 'Duplicate Image Finder',
  'grayscale-converter': 'Grayscale Converter',
  'image-blur': 'Image Blur',
  'image-inverter': 'Image Inverter',
  'sepia-filter': 'Sepia Filter',
  'image-metadata': 'Image Metadata Viewer',
  'image-pixelator': 'Image Pixelator',
  'add-noise': 'Add Noise',
  'add-vignette': 'Add Vignette',
  'heic-to-jpg': 'HEIC to JPG',
  'heic-to-png': 'HEIC to PNG',
  'webp-to-png': 'WebP to PNG',
  'webp-to-jpg': 'WebP to JPG',
  'png-to-jpg': 'PNG to JPG',
  'jpg-to-png': 'JPG to PNG',
  'svg-to-png': 'SVG to PNG',
  'png-to-ico': 'PNG to ICO',
  'jpg-to-webp': 'JPG to WebP',
  'png-to-webp': 'PNG to WebP',
  'gif-to-png': 'GIF to PNG',
  'bmp-to-png': 'BMP to PNG',
  'tiff-to-png': 'TIFF to PNG',
  'tiff-to-jpg': 'TIFF to JPG',
  'ico-to-png': 'ICO to PNG',
  'image-to-base64': 'Image to Base64',
};

const basePath = 'app/tools/image-tools';

const canvasTools = {
  'image-compressor': `'use client';
import { useState, useRef } from 'react';
export default function ImageCompressorPage() {
  const [image, setImage] = useState(null);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const compress = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const url = canvas.toDataURL('image/jpeg', quality / 100);
      setResult(url);
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Compressor</h1>
        <p className="text-neutral-400 text-center mb-8">Compress images without losing quality</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={compress} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Compress</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="compressed.jpg" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'image-resizer': `'use client';
import { useState, useRef } from 'react';
export default function ImageResizerPage() {
  const [image, setImage] = useState(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { const url = URL.createObjectURL(f); setImage(url); const img = new Image(); img.onload = () => { setWidth(img.width); setHeight(img.height); }; img.src = url; setResult(null); } };
  const resize = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Resizer</h1>
        <p className="text-neutral-400 text-center mb-8">Resize images to specific dimensions</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Width (px)</label><input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Height (px)</label><input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" /></div>
          </div>
          <button onClick={resize} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Resize</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="resized.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'image-rotate': `'use client';
import { useState, useRef } from 'react';
export default function ImageRotatePage() {
  const [image, setImage] = useState(null);
  const [angle, setAngle] = useState(90);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const rotate = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const rad = angle * Math.PI / 180;
      const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
      canvas.width = img.height * sin + img.width * cos;
      canvas.height = img.height * cos + img.width * sin;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width/2, -img.height/2);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Rotate</h1>
        <p className="text-neutral-400 text-center mb-8">Rotate images by any angle</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-2 justify-center">{[90,180,270].map(a => <button key={a} onClick={() => setAngle(a)} className={\`px-4 py-2 rounded-lg font-semibold transition \${angle===a?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-700'}\`}>{a}°</button>)}</div>
          <div><label className="block text-sm text-neutral-400 mb-1">Custom angle: {angle}°</label><input type="range" min="0" max="360" value={angle} onChange={e => setAngle(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={rotate} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Rotate</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="rotated.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'image-flip': `'use client';
import { useState, useRef } from 'react';
export default function ImageFlipPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const flip = (horizontal) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (horizontal) { ctx.translate(img.width, 0); ctx.scale(-1, 1); }
      else { ctx.translate(0, img.height); ctx.scale(1, -1); }
      ctx.drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Flip</h1>
        <p className="text-neutral-400 text-center mb-8">Flip images horizontally or vertically</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => flip(true)} disabled={!image} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Flip Horizontal</button>
            <button onClick={() => flip(false)} disabled={!image} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Flip Vertical</button>
          </div>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="flipped.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'grayscale-converter': `'use client';
import { useState, useRef } from 'react';
export default function GrayscaleConverterPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const convert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const avg = (data.data[i] + data.data[i+1] + data.data[i+2]) / 3;
        data.data[i] = data.data[i+1] = data.data[i+2] = avg;
      }
      ctx.putImageData(data, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Grayscale Converter</h1>
        <p className="text-neutral-400 text-center mb-8">Convert images to grayscale</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert to Grayscale</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="grayscale.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'image-blur': `'use client';
import { useState, useRef } from 'react';
export default function ImageBlurPage() {
  const [image, setImage] = useState(null);
  const [blur, setBlur] = useState(5);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.filter = \`blur(\${blur}px)\`;
      ctx.drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Blur</h1>
        <p className="text-neutral-400 text-center mb-8">Add blur effect to images</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Blur: {blur}px</label><input type="range" min="1" max="20" value={blur} onChange={e => setBlur(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Apply Blur</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="blurred.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'image-inverter': `'use client';
import { useState, useRef } from 'react';
export default function ImageInverterPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const invert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] = 255 - data.data[i];
        data.data[i+1] = 255 - data.data[i+1];
        data.data[i+2] = 255 - data.data[i+2];
      }
      ctx.putImageData(data, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Inverter</h1>
        <p className="text-neutral-400 text-center mb-8">Invert image colors</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={invert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Invert Colors</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="inverted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'sepia-filter': `'use client';
import { useState, useRef } from 'react';
export default function SepiaFilterPage() {
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(100);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const f = intensity / 100;
      for (let i = 0; i < data.data.length; i += 4) {
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        data.data[i] = Math.min(255, r*(1-0.607*f) + g*0.769*f + b*0.189*f);
        data.data[i+1] = Math.min(255, r*0.349*f + g*(1-0.314*f) + b*0.168*f);
        data.data[i+2] = Math.min(255, r*0.272*f + g*0.534*f + b*(1-0.869*f));
      }
      ctx.putImageData(data, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Sepia Filter</h1>
        <p className="text-neutral-400 text-center mb-8">Apply sepia tone effect to images</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Intensity: {intensity}%</label><input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Apply Sepia</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="sepia.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'brightness-contrast': `'use client';
import { useState, useRef } from 'react';
export default function BrightnessContrastPage() {
  const [image, setImage] = useState(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.filter = \`brightness(\${brightness}%) contrast(\${contrast}%)\`;
      ctx.drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Brightness and Contrast</h1>
        <p className="text-neutral-400 text-center mb-8">Adjust image brightness and contrast</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Brightness: {brightness}%</label><input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-neutral-400 mb-1">Contrast: {contrast}%</label><input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Apply</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="adjusted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'image-to-base64': `'use client';
import { useState, useRef } from 'react';
export default function ImageToBase64Page() {
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef();
  const encode = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setResult(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image to Base64</h1>
        <p className="text-neutral-400 text-center mb-8">Convert images to Base64 data URI</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{fileName || 'Click or drop an image here'}</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={encode} />
          </div>
          {result && <div className="space-y-2"><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-xs h-48 resize-none font-mono" value={result} readOnly /><button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy Base64</button></div>}
        </div>
      </div>
    </div>
  );
}`,

  'image-metadata': `'use client';
import { useState, useRef } from 'react';
export default function ImageMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();
  const analyze = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setMetadata({ name: file.name, size: (file.size/1024).toFixed(2) + ' KB', type: file.type, width: img.width + ' px', height: img.height + ' px', lastModified: new Date(file.lastModified).toLocaleString() });
    };
    img.src = url;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Metadata Viewer</h1>
        <p className="text-neutral-400 text-center mb-8">View image metadata and EXIF data</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {preview ? <img src={preview} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={analyze} />
          </div>
          {metadata && <div className="space-y-2">{Object.entries(metadata).map(([k,v]) => <div key={k} className="flex justify-between bg-neutral-800 rounded-lg p-3"><span className="text-neutral-400 capitalize">{k}</span><span className="text-indigo-400 font-mono">{v}</span></div>)}</div>}
        </div>
      </div>
    </div>
  );
}`,
};

// Format converters using canvas
const formatConverters = {
  'png-to-jpg': ['PNG to JPG', 'image/png', 'image/jpeg', '.png', 'converted.jpg'],
  'jpg-to-png': ['JPG to PNG', 'image/jpeg', 'image/png', '.jpg,.jpeg', 'converted.png'],
  'webp-to-png': ['WebP to PNG', 'image/webp', 'image/png', '.webp', 'converted.png'],
  'webp-to-jpg': ['WebP to JPG', 'image/webp', 'image/jpeg', '.webp', 'converted.jpg'],
  'jpg-to-webp': ['JPG to WebP', 'image/jpeg', 'image/webp', '.jpg,.jpeg', 'converted.webp'],
  'png-to-webp': ['PNG to WebP', 'image/png', 'image/webp', '.png', 'converted.webp'],
  'gif-to-png': ['GIF to PNG', 'image/gif', 'image/png', '.gif', 'converted.png'],
  'bmp-to-png': ['BMP to PNG', 'image/bmp', 'image/png', '.bmp', 'converted.png'],
  'ico-to-png': ['ICO to PNG', 'image/x-icon', 'image/png', '.ico', 'converted.png'],
};

Object.entries(formatConverters).forEach(([slug, [title, fromMime, toMime, accept, downloadName]]) => {
  canvasTools[slug] = `'use client';
import { useState, useRef } from 'react';
export default function ${title.replace(/\s+/g,'')}Page() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const convert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('${toMime}'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">${title}</h1>
        <p className="text-neutral-400 text-center mb-8">Convert ${title} in your browser</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="${accept}" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="${downloadName}" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`;
});

// Coming soon tools
const comingSoon = ['image-cropper', 'round-corners', 'add-text-to-image', 'add-border-to-image', 'image-comparison', 'duplicate-image-finder', 'image-pixelator', 'add-noise', 'add-vignette', 'heic-to-jpg', 'heic-to-png', 'svg-to-png', 'png-to-ico', 'tiff-to-png', 'tiff-to-jpg'];

comingSoon.forEach(slug => {
  const title = tools[slug];
  canvasTools[slug] = `'use client';
export default function ${title.replace(/\s+/g,'')}Page() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-3xl font-bold mb-4">${title}</h1>
        <p className="text-neutral-400 mb-8">This tool is coming soon.</p>
        <div className="bg-neutral-900 rounded-xl p-8"><div className="text-indigo-400 text-xl font-semibold">Coming Soon</div></div>
      </div>
    </div>
  );
}`;
});

Object.entries(canvasTools).forEach(([slug, content]) => {
  const dir = path.join(basePath, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.jsx'), content, 'utf8');
  console.log('Created: ' + path.join(dir, 'page.jsx'));
});

console.log('All image tools created!');