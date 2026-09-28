'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
export default function GrayscaleConverterPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setSrcType(f.type); setResult(null); setError(''); } };
  const convert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        // Luminance with the weights of the CSS grayscale() filter (Rec. 709), as
        // image editors do; the plain average made blue as light as green (29/09).
        const avg = 0.2126 * data.data[i] + 0.7152 * data.data[i+1] + 0.0722 * data.data[i+2];
        data.data[i] = data.data[i+1] = data.data[i+2] = avg;
      }
      ctx.putImageData(data, 0, 0);
      try { setResult(encodeLike(canvas, srcType)); } catch (e) { setError(e.message); }
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
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download={`grayscale.${extOf(result)}`} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Grayscale Converter"
        description="Grayscale Converter turns a color image into black and white using each pixel's luminance (the weights of the CSS grayscale filter, Rec. 709), so blues stay dark and greens light as the eye sees them, entirely in your browser. A JPEG stays a JPEG, a PNG keeps its transparency. Your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select a color image from your device.",
          "Click 'Convert to Grayscale' to process the image.",
          "Preview the result.",
          "Click the download button to save your grayscale PNG image."
        ]}
        faqs={[
          { q: "What image formats does Grayscale Converter support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The result keeps your image's format: a JPG stays a JPG, a PNG stays a PNG (transparency included), a WebP stays a WebP where the browser can save WebP (otherwise PNG)." },
          { q: "Is there a file size limit for uploading images?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Will the tool reduce the quality of my image?", a: "No, the original resolution is preserved — only the color information is changed." },
          { q: "Can I convert multiple images at once?", a: "No, the tool converts one image at a time — there's no batch upload." }
        ]}
        tips={[
          "Well-lit portraits with clear contrast tend to convert to grayscale most effectively.",
          "A photo stays in its own format (JPG in, JPG out), so the file does not balloon; PNG and transparent images stay PNG.",
          "Try converting a few different photos to see which ones look best in black and white.",
          "Grayscale images work well for formal documents, resumes, and prints where color isn't needed."
        ]}
      />
    </div>
  );
}