'use client';
import { useState, useRef } from 'react';

export default function AddTextToImagePage() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('Hello World');
  const [fontSize, setFontSize] = useState(40);
  const [color, setColor] = useState('#ffffff');
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
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
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(text, img.width * posX / 100, img.height * posY / 100);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Add Text to Image</h1>
        <p className="text-neutral-500 text-center mb-8">Overlay text on images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Text</label><input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Font Size: {fontSize}px</label><input type="range" min="10" max="200" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Color</label><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">X Position: {posX}%</label><input type="range" min="0" max="100" value={posX} onChange={e => setPosX(parseInt(e.target.value))} className="w-full" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Y Position: {posY}%</label><input type="range" min="0" max="100" value={posY} onChange={e => setPosY(parseInt(e.target.value))} className="w-full" /></div>
          </div>
          <button onClick={apply} disabled={!image || !text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Apply Text</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="text-image.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Add Text To Image</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Add Text To Image is a free online tool that allows you to easily overlay custom text onto any image without requiring design skills or software installation. Perfect for creating memes, social media graphics, presentations, and promotional content in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Add Text To Image</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your image by clicking the upload button or dragging and dropping your file onto the canvas</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click on the canvas where you want to add text and type your desired message</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize your text using options to change font, size, color, alignment, and transparency</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your edited image in your preferred format by clicking the download button</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats are supported by Add Text To Image?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports all common image formats including JPG, PNG, GIF, BMP, and WEBP. You can upload images up to 10MB in size.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I add multiple text boxes to a single image?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can add unlimited text boxes to your image. Simply click different areas of the canvas to create new text layers and position them as needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit to how much text I can add?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">There is no strict limit on text length, but very long text may require adjustment of font size to fit properly on your image.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Add Text To Image is completely free and requires no account creation or login. You can start using it immediately.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use contrasting colors for your text to ensure it stands out clearly against your image background</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different fonts and sizes to find the best combination that matches your image style and message</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Add a subtle shadow or outline to your text to improve readability if your image has a busy background</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your edited image as PNG format if you need transparency, or JPG for smaller file sizes and better compatibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
}