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
    </div>
  );
}