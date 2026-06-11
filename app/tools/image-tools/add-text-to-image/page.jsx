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
    </div>
  );
}