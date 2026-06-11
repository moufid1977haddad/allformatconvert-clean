'use client';
import { useState, useRef } from 'react';

export default function ImagePixelatorPage() {
  const [image, setImage] = useState(null);
  const [pixelSize, setPixelSize] = useState(10);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
    setResult(null);
  };

  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
          const data = ctx.getImageData(x, y, 1, 1).data;
          ctx.fillStyle = `rgba(${data[0]},${data[1]},${data[2]},${data[3]/255})`;
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Pixelator</h1>
        <p className="text-neutral-500 text-center mb-8">Add pixelate/mosaic effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Pixel Size: {pixelSize}px</label><input type="range" min="2" max="50" value={pixelSize} onChange={e => setPixelSize(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Apply Pixelate</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="pixelated.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Pixelator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image Pixelator is a free online tool that instantly blurs and pixelates images to protect privacy and hide sensitive information without requiring any downloads or software installation. Simply upload your image, adjust the pixelation level, and download the modified image in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Pixelator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Image Pixelator website and click the upload button to select an image from your computer or device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Adjust the pixelation intensity using the slider to control how much the image will be blurred or pixelated</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Select the specific areas you want to pixelate by drawing rectangles or circles on the image preview</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your pixelated image to your device in your preferred format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Image Pixelator really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Image Pixelator is completely free with no hidden charges, subscriptions, or premium features required to pixelate your images.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Image Pixelator support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Pixelator supports all common image formats including JPG, PNG, GIF, BMP, WebP, and TIFF for both uploading and downloading.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my image data secure and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all images are processed locally in your browser and are never stored on our servers, ensuring complete privacy and security.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I pixelate multiple images at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Pixelator processes one image at a time, but you can quickly pixelate multiple images by repeating the process for each image.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use a higher pixelation level for more sensitive information like faces and license plates, and lower levels for general privacy needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Take advantage of the selection tools to pixelate only specific areas rather than the entire image for better results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different pixelation levels on a copy of your image first to find the perfect balance between privacy and visibility</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Resize your image before uploading for faster processing times, especially if you're working with high-resolution or large file images</li>
          </ul>
        </div>
      </div>
    </div>
  );
}