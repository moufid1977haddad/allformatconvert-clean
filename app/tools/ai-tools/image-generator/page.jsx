'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

const MAX_CHARS = 1000;
const PER_DAY = 5; // lib/quota/imageGen.js IMAGE_GEN_PER_IP_PER_DAY
const SIZES = [
  { id: '1024x1024', label: 'Square', note: '1024×1024' },
  { id: '1024x1536', label: 'Portrait', note: '1024×1536' },
  { id: '1536x1024', label: 'Landscape', note: '1536×1024' },
];
const EXAMPLES = [
  'A cosy reading nook by a rainy window, warm lamp light, watercolor style',
  'Isometric illustration of a tiny island with a lighthouse, pastel colors',
  'Close-up photo of a hummingbird drinking from a red flower, soft morning light',
];

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const generate = async () => {
    const text = prompt.trim();
    if (!text) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: text, size }) });
      if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/')) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Image generation failed. Please try again.');
      }
      const blob = await res.blob();
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ url: URL.createObjectURL(blob), blob, prompt: text, size });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPng = async () => {
    const bmp = await createImageBitmap(result.blob);
    const c = document.createElement('canvas');
    c.width = bmp.width; c.height = bmp.height;
    c.getContext('2d').drawImage(bmp, 0, 0);
    c.toBlob((b) => {
      if (!b || b.type !== 'image/png') { setError('This browser could not convert the image to PNG — download the WebP instead.'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'ai-image.png';
      a.click();
    }, 'image/png');
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">AI Image Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Describe an image and get it in seconds — {PER_DAY} free images a day, no signup</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm text-neutral-600 mb-1">Describe your image</label>
            <textarea id="prompt" value={prompt} maxLength={MAX_CHARS} onChange={(e) => setPrompt(e.target.value)} rows={4}
              placeholder="e.g. A red fox in a snowy forest at sunrise, photorealistic"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-indigo-400 focus:outline-none" />
            <div className="flex justify-between text-xs text-neutral-500"><span>Be specific: subject, setting, style, lighting.</span><span>{prompt.length}/{MAX_CHARS}</span></div>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setPrompt(ex)} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-200">{ex.split(',')[0]}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {SIZES.map((s) => (
              <button key={s.id} type="button" onClick={() => setSize(s.id)} disabled={loading} className={'flex-1 rounded-lg py-2 text-sm font-semibold transition ' + (size === s.id ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')}>
                {s.label}<span className="block text-xs font-normal opacity-80">{s.note}</span>
              </button>
            ))}
          </div>
          <button onClick={generate} disabled={!prompt.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Generating… (about 10–30 seconds)' : 'Generate Image'}
          </button>
          {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3">
              <img src={result.url} alt={result.prompt} className="w-full rounded-lg border border-neutral-200" />
              <div className="flex gap-2">
                <a href={result.url} download="ai-image.webp" className="flex-1 text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download WebP</a>
                <button onClick={downloadPng} className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl py-2 font-semibold transition">Download PNG</button>
              </div>
            </div>
          )}
          <p className="text-xs text-neutral-500">Your description is sent to OpenAI (model gpt-image-2) to create the image; the image itself is not stored by us. Descriptions that break the provider's content policy are refused. {PER_DAY} images per day per visitor.</p>
        </div>
      </div>
      <SeoContent
        title="AI Image Generator"
        description={`AI Image Generator turns a text description into an image with OpenAI's gpt-image-2 model — among the highest-rated image models in independent blind comparisons. Choose square, portrait or landscape, then download the result as WebP or PNG. It's free, with no signup: ${PER_DAY} images per day per visitor, like the daily limits of the best-known free generators.`}
        howTo={[
          'Describe the image you want: subject, setting, style and lighting.',
          'Choose square, portrait or landscape.',
          "Click 'Generate Image' and wait 10 to 30 seconds.",
          'Download the result as WebP, or as PNG if you need it.'
        ]}
        faqs={[
          { q: 'Is the AI Image Generator free?', a: `Yes: ${PER_DAY} images per day per visitor, no signup and no watermark. The count resets at midnight UTC.` },
          { q: 'Which AI model does it use?', a: "OpenAI's gpt-image-2, at its fast quality setting, in 1024×1024, 1024×1536 or 1536×1024 pixels." },
          { q: 'Can I use the images commercially?', a: "OpenAI's terms assign you the rights to images you create, subject to their usage policies. Check that your image doesn't copy a protected work, logo or a real person's likeness." },
          { q: 'Why was my description refused?', a: "The provider's safety filter refuses content that breaks its usage policy (for example violence, sexual content or real people in misleading situations). A refused request does not count against your daily images." },
          { q: 'Is my description stored?', a: 'We do not store your description or the image. The description is sent to OpenAI to generate the image, under their API privacy terms.' }
        ]}
        tips={[
          'Name a style for consistent results: "watercolor", "35mm photo", "flat vector illustration", "3D render".',
          'Describe lighting and mood: "golden hour", "neon-lit", "soft studio light".',
          'Text inside images works best when short and put in quotes.',
          'Not quite right? Adjust one detail at a time rather than rewriting everything.'
        ]}
      />
    </div>
  );
}
