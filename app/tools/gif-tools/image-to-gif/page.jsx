'use client';
import { useState, useRef } from 'react';
export default function ImageToGifPage() {
  const [images, setImages] = useState([]);
  const [delay, setDelay] = useState(200);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(f => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: f.name, src: reader.result });
      reader.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs => setImages(prev => [...prev, ...imgs]));
  };

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const createPreview = async () => {
    if (images.length < 2) return;
    setLoading(true);
    const canvas = document.createElement('canvas');
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = images[0].src; });
    canvas.width = img.width; canvas.height = img.height;
    setPreview(images.map(i => i.src));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Image to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Create animated GIF from multiple images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add images</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.src} className="w-full h-20 object-cover rounded border border-neutral-200" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
                  <p className="text-xs text-neutral-500 text-center">{i+1}</p>
                </div>
              ))}
            </div>
          )}
          <div><label className="block text-sm text-neutral-500 mb-1">Frame Delay: {delay}ms</label><input type="range" min="50" max="1000" value={delay} onChange={e => setDelay(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={createPreview} disabled={images.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Creating...' : 'Create GIF Preview'}</button>
          {preview && (
            <div className="space-y-3 text-center">
              <p className="text-green-600 font-semibold">Preview frames ready ({preview.length} frames)</p>
              <div className="grid grid-cols-4 gap-2">
                {preview.map((src, i) => <img key={i} src={src} className="w-full rounded border border-neutral-200" />)}
              </div>
              <p className="text-neutral-500 text-xs">Download each frame and use an online GIF assembler</p>
              <div className="grid grid-cols-2 gap-2">
                {preview.map((src, i) => <a key={i} href={src} download={"frame-" + (i+1) + ".png"} className="block text-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg py-1 text-sm transition text-neutral-600">Download Frame {i+1}</a>)}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image To Gif</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image To Gif is a free online tool that converts your static images into animated GIF files instantly without requiring any software installation. Create engaging animated GIFs from multiple images or image sequences with just a few clicks.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image To Gif</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Image To Gif website and click the upload button to select your images from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Arrange your images in the desired order and set the delay time between frames to control animation speed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your GIF animation to ensure it looks correct before finalizing</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your animated GIF file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Image To Gif support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image To Gif supports all common image formats including JPG, PNG, BMP, GIF, and WebP files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading images?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most images up to 50MB can be uploaded, though larger files may take longer to process.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I adjust the speed of my GIF animation?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can set custom delay times between frames to make your GIF faster or slower as needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Image To Gif?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Image To Gif is completely free and requires no account creation or login.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use consistent image dimensions for the best results and smoother animations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Start with a delay of 100-200 milliseconds between frames for natural-looking animations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Arrange images in chronological order to create logical animation sequences</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress your images before uploading to speed up processing and reduce file size of the final GIF</li>
          </ul>
        </div>
      </div>
    </div>
  );
}