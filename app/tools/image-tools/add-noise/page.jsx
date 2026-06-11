'use client';
import { useState, useRef } from 'react';

export default function AddNoisePage() {
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(30);
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
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity * 2;
        data.data[i] = Math.min(255, Math.max(0, data.data[i] + noise));
        data.data[i+1] = Math.min(255, Math.max(0, data.data[i+1] + noise));
        data.data[i+2] = Math.min(255, Math.max(0, data.data[i+2] + noise));
      }
      ctx.putImageData(data, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Add Noise</h1>
        <p className="text-neutral-500 text-center mb-8">Add film grain effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}</label><input type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Add Noise</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="noisy.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Add Noise</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Add Noise is a free online tool that allows you to instantly add various types of noise effects to your images, including grain, dust, and static textures. Enhance your photos with professional-quality noise filters without requiring any software installation or technical expertise.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Add Noise</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Add Noise tool and click the upload button to select an image from your computer or device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your preferred noise type from the available options such as Gaussian, salt and pepper, or Poisson noise</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust the noise intensity slider to control how much noise is added to your image</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Download button to save your noise-enhanced image to your device in your preferred format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Add Noise completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Add Noise is completely free with no hidden fees, watermarks, or premium subscriptions required for any features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Add Noise support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Add Noise supports all common image formats including JPG, PNG, GIF, WebP, and BMP for both uploading and downloading.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I undo or adjust the noise effect after adding it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can adjust the noise intensity before downloading, and you can re-upload your original image to start over at any time.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my image data secure and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your images are processed securely and are not stored on our servers after processing, ensuring your privacy and data protection.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Start with a lower noise intensity and gradually increase it to find the perfect balance for your specific image and desired effect</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different noise types on the same image to discover which style best matches your creative vision or project needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Add Noise works best on photos with good lighting and clear subjects, as noise effects enhance detail and texture visibility</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the noise effect sparingly on portraits to avoid unwanted grain, but apply it generously to landscape or artistic photos for dramatic impact</li>
          </ul>
        </div>
      </div>
    </div>
  );
}