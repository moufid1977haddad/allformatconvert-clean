'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

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
      <SeoContent
        title="Image Comparison"
        description="Image Comparison shows two images stacked with a draggable vertical divider, letting you slide between a 'before' and 'after' view to spot differences. Both images stay in your browser — nothing is uploaded to a server."
        howTo={[
          "Click the first box and upload your 'before' image.",
          "Click the second box and upload your 'after' image.",
          "Drag the slider left and right to reveal more or less of each image.",
          "Compare the two visually — there's no export or download for the comparison itself."
        ]}
        faqs={[
          { q: "What image formats does Image Comparison support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP." },
          { q: "Is my image data stored or shared?", a: "No, both images stay in your browser and are never uploaded to a server." },
          { q: "Can I compare more than two images at once?", a: "No, the tool only supports comparing two images at a time." },
          { q: "Can I export or download the comparison view?", a: "No, there's no export or screenshot feature built in — the slider is for on-screen viewing only." }
        ]}
        tips={[
          "Use images with the same dimensions and framing for the most useful comparison.",
          "Drag the slider slowly across areas you want to inspect closely.",
          "If you want to share the comparison, take a manual screenshot of your browser window.",
          "This is a visual before/after tool, not a pixel-difference detector — it won't highlight changes automatically."
        ]}
      />
    </div>
  );
}