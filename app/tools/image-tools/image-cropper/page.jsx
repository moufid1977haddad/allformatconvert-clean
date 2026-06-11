'use client';
import { useState, useRef } from 'react';
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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Cropper</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image Cropper is a free online tool that allows you to quickly resize and crop images without installing any software. Perfect for social media, web design, and personal projects, it supports multiple image formats and delivers instant results.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Cropper</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your image by clicking the upload button or dragging and dropping your file into the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Use the cropping handles to select the area of the image you want to keep by clicking and dragging</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust the crop dimensions using the width and height fields for precise sizing if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your cropped image to your device in your preferred format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Image Cropper support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Cropper supports all major image formats including JPG, PNG, GIF, WebP, and BMP files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Image Cropper really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Image Cropper is completely free with no hidden fees, watermarks, or registration required.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I crop images on my mobile device?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Image Cropper works on all devices including smartphones and tablets with any modern web browser.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded images be saved or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your images are processed locally in your browser and are never stored on our servers for privacy protection.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the aspect ratio lock feature to maintain proportions when cropping images for specific platforms like Instagram or Twitter</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Try rotating your image before cropping for better composition and to achieve your desired framing</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Preview your crop before downloading to ensure you're satisfied with the final result</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch crop multiple images by uploading them one at a time to save time on repetitive editing tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}