'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function GrayscaleConverterPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setResult(null); setError(''); } };
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
      setError('');
    };
    img.onerror = () => {
      setError('Could not load this image. The file may be corrupted or in an unsupported format.');
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Grayscale Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert images to grayscale</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert to Grayscale</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="grayscale.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Grayscale Converter"
        description="Grayscale Converter turns a color image into black and white by averaging each pixel's red, green, and blue values, entirely in your browser. Your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select a color image from your device.",
          "Click 'Convert to Grayscale' to process the image.",
          "Preview the result.",
          "Click the download button to save your grayscale PNG image."
        ]}
        faqs={[
          { q: "What image formats does Grayscale Converter support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Is there a file size limit for uploading images?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Will the tool reduce the quality of my image?", a: "No, the original resolution is preserved — only the color information is changed." },
          { q: "Can I convert multiple images at once?", a: "No, the tool converts one image at a time — there's no batch upload." }
        ]}
        tips={[
          "Well-lit portraits with clear contrast tend to convert to grayscale most effectively.",
          "The output is always saved as PNG, which keeps full quality with no compression loss.",
          "Try converting a few different photos to see which ones look best in black and white.",
          "Grayscale images work well for formal documents, resumes, and prints where color isn't needed."
        ]}
      />
    </div>
  );
}