'use client';
import { useEffect, useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

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
  const [error, setError] = useToolError('');
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

  // The same image as PNG, made as soon as the WebP arrives so it is offered as a file of its own (name, size).
  const [png, setPng] = useState(null);
  useEffect(() => {
    setPng(null);
    if (!result) return undefined;
    let alive = true;
    (async () => {
      const bmp = await createImageBitmap(result.blob);
      const c = document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      c.getContext('2d').drawImage(bmp, 0, 0);
      c.toBlob((b) => {
        if (!alive) return;
        if (!b || b.type !== 'image/png') { setError('This browser could not convert the image to PNG — download the WebP instead.'); return; }
        setPng(b);
      }, 'image/png');
    })().catch(() => { if (alive) setError('This browser could not convert the image to PNG — download the WebP instead.'); });
    return () => { alive = false; };
  }, [result]);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">AI Image Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Describe an image and get one AI-made picture — {PER_DAY} free images a day, no signup</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm text-neutral-600 mb-1">Describe your image</label>
            <TextArea id="prompt" value={prompt} maxLength={MAX_CHARS} onChange={(e) => setPrompt(e.target.value)} rows={4}
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
            {loading ? 'Generating…' : 'Generate Image'}
          </button>
          {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3">
              <img src={result.url} alt={result.prompt} className="w-full rounded-lg border border-neutral-200" />
              <DownloadGroup zipName="ai-image.zip" alternatives>
                <FileDownload href={result.url} name="ai-image.webp" />
                {png && <FileDownload blob={png} name="ai-image.png" primary={false} />}
              </DownloadGroup>
            </div>
          )}
          <p className="text-xs text-neutral-500">Your description is sent to OpenAI (model gpt-image-2) to create the image; the image itself is not stored by us. Descriptions that break the provider's content policy are refused. {PER_DAY} images per day per visitor.</p>
        </div>
      </div>
      <SeoContent
        title="AI Image Generator"
        description={`AI Image Generator creates one image from a text description with OpenAI's gpt-image-2 model at its low quality setting. You write up to ${MAX_CHARS.toLocaleString('en-US')} characters, choose square, portrait or landscape (${SIZES.map((s) => s.note).join(', ')} pixels) and get a WebP image back from OpenAI; the page also makes a PNG copy in your browser. Your description goes through our server to OpenAI, whose safety filter refuses some requests. Each visitor gets ${PER_DAY} images per day. The site adds no watermark and keeps no copy of the image.`}
        howToTitle="How to generate an image from text"
        howTo={[
          "Describe the image under \"Describe your image\": subject, setting, style and lighting, or click one of the examples.",
          "Choose \"Square\", \"Portrait\" or \"Landscape\".",
          "Click \"Generate Image\" and wait until the image appears.",
          "Click \"Download\" next to ai-image.webp or ai-image.png, or \"Download all\" to get both in a ZIP."
        ]}
        specs={[
          { label: "Description", value: `Up to ${MAX_CHARS.toLocaleString('en-US')} characters` },
          { label: "Sizes", value: SIZES.map((s) => `${s.label} ${s.note}`).join(', ') },
          { label: "Output", value: "WebP sent by OpenAI, plus a PNG copy made in your browser" },
          { label: "Daily allowance", value: `${PER_DAY} images per visitor per UTC day; a request refused by the safety filter is not counted` },
          { label: "Other limits", value: "A monthly budget of the generator's own and the site's monthly budget for paid tools; the hourly and daily per-connection limits of the paid tools also apply" }
        ]}
        privacyTitle="Where your image is made"
        privacy="Your description and the chosen size are sent to our server, which asks OpenAI's gpt-image-2 for one image and passes the WebP back to your browser without saving it. Only the PNG copy is made on your device. For each image our server log keeps the size and the token counts, never the description."
        faqs={[
          { q: "How many images can I make per day?", a: `${PER_DAY} per visitor per UTC day; the count resets at midnight UTC, and a description refused by the safety filter is given back. The generator also stops if its own monthly budget or the site's budget runs out, and the hourly and daily per-connection limits of the paid tools apply.` },
          { q: "Can I choose the model or the quality?", a: `No. OpenAI's gpt-image-2 at its low quality setting, one image per request, in ${SIZES.map((s) => s.note).join(', ')} pixels, is fixed on our server; the page sends only your description and the size you chose.` },
          { q: "Can a description be refused?", a: "Yes. OpenAI's safety filter blocks descriptions that break OpenAI's usage policies. The page shows a message, and the request does not use one of your daily images. Describe something else and try again." },
          { q: "Do you keep my description or the image?", a: "No. The image is passed to your browser and not stored by us, and the description is not written to our logs. OpenAI receives the description to make the image, under its own API data terms." }
        ]}
        tips={[
          "Name a style for consistent results: \"watercolor\", \"35mm photo\", \"flat vector illustration\", \"3D render\".",
          "Describe lighting and mood: \"golden hour\", \"neon-lit\", \"soft studio light\"."
        ]}
      />
    </div>
  );
}
