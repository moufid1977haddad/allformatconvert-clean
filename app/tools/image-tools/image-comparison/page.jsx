'use client';
import { useState, useRef } from 'react';

export default function ImageComparisonPage() {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);
  const ref1 = useRef();
  const ref2 = useRef();

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Comparison</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two images with a slider</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => ref1.current.click()}>
              {image1 ? <img src={image1} className="max-h-32 mx-auto rounded" /> : <p className="text-neutral-500 text-sm">Image 1 (Before)</p>}
              <input ref={ref1} type="file" accept="image/*" className="hidden" onChange={e => setImage1(URL.createObjectURL(e.target.files[0]))} />
            </div>
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => ref2.current.click()}>
              {image2 ? <img src={image2} className="max-h-32 mx-auto rounded" /> : <p className="text-neutral-500 text-sm">Image 2 (After)</p>}
              <input ref={ref2} type="file" accept="image/*" className="hidden" onChange={e => setImage2(URL.createObjectURL(e.target.files[0]))} />
            </div>
          </div>
          {image1 && image2 && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl" style={{height: '300px'}}>
                <img src={image2} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 overflow-hidden" style={{width: sliderPos + '%'}}>
                  <img src={image1} className="absolute inset-0 w-full h-full object-cover" style={{width: (100 / sliderPos * 100) + '%', maxWidth: 'none'}} />
                </div>
                <div className="absolute top-0 bottom-0 w-1 bg-white" style={{left: sliderPos + '%'}}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-neutral-900 font-bold shadow-lg">⇄</div>
                </div>
              </div>
              <div><label className="block text-sm text-neutral-500 mb-1">Slider: {sliderPos}%</label><input type="range" min="0" max="100" value={sliderPos} onChange={e => setSliderPos(parseInt(e.target.value))} className="w-full" /></div>
              <div className="flex justify-between text-sm text-neutral-500"><span>Before</span><span>After</span></div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Comparison</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image Comparison is a free online tool that allows you to compare two images side-by-side to identify differences, similarities, and changes. Perfect for photographers, designers, and anyone needing to spot variations between visual content quickly and easily.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Comparison</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload or select your first image by clicking the upload button or dragging it into the designated area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Upload your second image in the same way to the comparison panel</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Use the slider or toggle feature to move between the two images and identify differences</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your comparison results or share them directly with others using the export options</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Image Comparison support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Comparison supports all major image formats including JPG, PNG, GIF, WebP, and BMP files up to 10MB each.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my image data stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Image Comparison processes all images locally in your browser and does not store or share your data with any servers.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I compare more than two images at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Currently, Image Comparison allows side-by-side comparison of two images at a time for optimal clarity and accuracy.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account is required. Image Comparison is completely free and available to use without registration or login.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the zoom feature to examine specific areas in detail and catch subtle differences you might otherwise miss</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Try the opacity slider mode for a smooth transition between images, which is great for spotting gradual changes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your comparisons as screenshots or use the share feature to collaborate with team members and get feedback</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure both images are similarly sized and oriented for the most accurate and useful comparison results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}