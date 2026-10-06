'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { MAX_IMAGE_CAPTIONER_ORIGINAL_BYTES } from '@/lib/quota/limits';
import { imageToVisionJpeg, VISION_MAX_SIDE } from '../../../lib/imageForVision';
import { formatBytes } from '../../../lib/formatBytes';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

const MAX_MB = MAX_IMAGE_CAPTIONER_ORIGINAL_BYTES / (1024 * 1024);

export default function ImageCaptionerPage() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const [preview, setPreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setOutput('');
    setImageFile(file);
    if (file.size > MAX_IMAGE_CAPTIONER_ORIGINAL_BYTES) {
      // Checked the moment the file is picked: nothing is decoded or sent.
      setPreview('');
      setError(`This image is ${formatBytes(file.size)} but this tool accepts images up to ${MAX_MB} MB.`);
      return;
    }
    setError('');
    // An object URL, not a data URL: a large photo must not be duplicated as a huge string in memory.
    setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(file); });
  };

  const process = async () => {
    if (!preview || !imageFile) return;
    setLoading(true);
    setOutput('');
    setError('');
    try {
      // The original never leaves the device: the model only sees a reduced image anyway (see imageForVision.js).
      const { base64 } = await imageToVisionJpeg(imageFile);
      const response = await fetch('/api/ai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, tool: 'image-captioner' }),
      });
      const data = await response.json();
      if (data.text) setOutput(data.text);
      else setError(data.error || 'No response received');
    } catch(e) { setError(e.message || 'Something went wrong. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Captioner</h1>
        <p className="text-neutral-500 text-center mb-8">Generate captions for images with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {preview ? <img src={preview} className="max-h-48 mx-auto rounded-lg" alt="preview" /> : <p className="text-neutral-500 text-sm"><UploadPrompt what="an image" /></p>}
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {MAX_MB} MB per image — it is reduced on your device before sending, so large photos work</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={process} disabled={!preview || loading || (imageFile && imageFile.size > MAX_IMAGE_CAPTIONER_ORIGINAL_BYTES)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Generating...' : 'Generate Caption'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Caption</label>
              <TextArea aria-label="Caption" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" value={output} readOnly />
              <TextDownload text={output} name="caption.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Image Captioner"
        description={`Image Captioner writes a short, descriptive caption for a photo or picture, using OpenAI's GPT-4o mini vision model. You pick one image of up to ${MAX_MB} MB: JPEG, PNG and WebP open in every browser, and a HEIC photo opens in Safari. Before it is sent, the page turns it on your device into a JPEG of at most ${VISION_MAX_SIDE.toLocaleString('en-US')} pixels on the longest side; only that copy goes through our server to OpenAI. The caption is plain text to copy or download as caption.txt. Transparent areas are sent as white, and one image is captioned at a time.`}
        howToTitle="How to generate a caption for an image"
        howTo={[
          "Click the upload area and choose an image; a preview appears.",
          "Click \"Generate Caption\" and wait while it shows \"Generating...\".",
          "Read the text under \"Caption\".",
          "Click \"Copy\" or \"Download\" (caption.txt) to keep it."
        ]}
        specs={[
          { label: "Input formats", value: "Any image your browser can decode, such as JPEG, PNG or WebP" },
          { label: "Maximum size", value: `${MAX_MB} MB per image` },
          { label: "Sent for analysis", value: `A JPEG copy, ${VISION_MAX_SIDE.toLocaleString('en-US')} px at most on the longest side` },
          { label: "Output", value: "One caption in plain text, with a .txt download" },
          { label: "Usage limits", value: "A limited number of requests per connection each hour and each day, shared with the site's other paid tools, and a monthly budget for the whole site" }
        ]}
        privacyTitle="Where your image is processed"
        privacy={`Before it is sent, your image is redrawn on your device as a JPEG with its longest side at ${VISION_MAX_SIDE.toLocaleString('en-US')} px or less and any transparency turned white; only that redrawn copy is sent to our server, and your original file stays on your device. Our server passes the copy to OpenAI's GPT-4o mini vision model, which writes the caption. We do not store the image or the caption.`}
        faqs={[
          { q: "Is my full-size photo uploaded?", a: `No. Only a JPEG copy, at most ${VISION_MAX_SIDE.toLocaleString('en-US')} pixels on its longest side, leaves your device, and it goes through our server to OpenAI. The original file is read in your browser and is never sent.` },
          { q: "Can I use a HEIC photo from an iPhone?", a: `Yes in Safari, which opens HEIC itself; in Chrome, Edge or Firefox, convert it first with HEIC to JPG. JPEG, PNG and WebP work in every browser, up to ${MAX_MB} MB, and an animated GIF is captioned from a single frame.` },
          { q: "Can I use the caption as alt text?", a: "Yes, after checking it. The model is asked for a creative, descriptive caption, so it may add mood or style words that alt text does not need. Trim it to what the image shows and why it matters on your page." },
          { q: "Why was my image refused?", a: `${MAX_MB} MB is the size limit, and an image the browser cannot read is refused too; both are explained before anything goes to our server. A request can also be stopped by your connection's hourly or daily limit or the site's monthly budget, and the message says when to try again.` }
        ]}
        tips={[
          "For a logo with a transparent background, check the caption: transparent areas reach the model as white."
        ]}
      />
    </div>
  );
}