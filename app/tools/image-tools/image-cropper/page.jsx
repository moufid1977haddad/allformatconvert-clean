'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ImageCropperPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const inputRef = useRef();
  const imgRef = useRef();
  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); };
  const applyCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    canvas.width = crop.w * scaleX;
    canvas.height = crop.h * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, crop.w * scaleX, crop.h * scaleY, 0, 0, canvas.width, canvas.height);
    setResult(canvas.toDataURL('image/png'));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Cropper</h1>
        <p className="text-neutral-500 text-center mb-8">Crop images with custom dimensions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img ref={imgRef} src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {image && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-neutral-500 mb-1">X: {crop.x}px</label><input type="range" min="0" max="500" value={crop.x} onChange={e => setCrop(p => ({...p, x: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">Y: {crop.y}px</label><input type="range" min="0" max="500" value={crop.y} onChange={e => setCrop(p => ({...p, y: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">Width: {crop.w}px</label><input type="range" min="10" max="1000" value={crop.w} onChange={e => setCrop(p => ({...p, w: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">Height: {crop.h}px</label><input type="range" min="10" max="1000" value={crop.h} onChange={e => setCrop(p => ({...p, h: parseInt(e.target.value)}))} className="w-full" /></div>
            </div>
          )}
          <button onClick={applyCrop} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Crop Image</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="cropped.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Image Cropper"
        description="Image Cropper lets you cut out a rectangular region of an image by entering exact X, Y, width, and height values in pixels — there's no drag-to-select handle on the image itself. Everything happens locally in your browser using the canvas element, and your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Set the X and Y position sliders to choose where the crop starts.",
          "Set the Width and Height sliders to define the crop size.",
          "Click 'Crop Image' and then the download button to save the result."
        ]}
        faqs={[
          { q: "What image formats does Image Cropper support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Is Image Cropper really free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Can I drag crop handles directly on the image?", a: "No, the crop area is set with numeric X/Y/width/height sliders rather than draggable handles on the image preview." },
          { q: "Will my uploaded images be saved or shared?", a: "No, your images are processed locally in your browser and are never uploaded to a server." }
        ]}
        tips={[
          "Watch the pixel values update live as you move each slider to fine-tune your crop area.",
          "There's no aspect-ratio lock, so calculate width and height yourself if you need a specific ratio like 1:1 or 16:9.",
          "Preview the result after clicking Crop Image before downloading, in case you need to adjust the values.",
          "Crop one image at a time — there's no batch processing option."
        ]}
      />
    </div>
  );
}