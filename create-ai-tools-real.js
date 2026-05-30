const fs = require('fs');
const path = require('path');

const basePath = 'app/tools/ai-tools';

const aiToolTemplate = (title, description, systemPrompt, placeholder, buttonText) => `'use client';
import { useState } from 'react';

export default function ${title.replace(/\s+/g,'')}Page() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const process = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput('');
    setError('');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: '${systemPrompt}',
          messages: [{ role: 'user', content: input }]
        })
      });
      const data = await response.json();
      if (data.content && data.content[0]) setOutput(data.content[0].text);
      else setError('No response received');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">${title}</h1>
        <p className="text-neutral-400 text-center mb-8">${description}</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none" placeholder="${placeholder}" value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : '${buttonText}'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-400">Result</label>
              <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

const tools = {
  'grammar-fixer': aiToolTemplate('Grammar Fixer', 'Fix grammar and spelling errors with AI', 'You are a grammar expert. Fix all grammar, spelling, and punctuation errors in the text. Return only the corrected text without explanations.', 'Paste text to fix grammar...', 'Fix Grammar'),
  'text-summarizer': aiToolTemplate('Text Summarizer', 'Summarize long texts with AI', 'You are a text summarizer. Create a concise summary of the provided text. Keep the key points and main ideas.', 'Paste text to summarize...', 'Summarize'),
  'ai-translator': aiToolTemplate('AI Translator', 'Translate text to any language with AI', 'You are a professional translator. Translate the provided text to English (or detect and translate to the most appropriate language). Return only the translation.', 'Paste text to translate...', 'Translate'),
  'ai-writer': aiToolTemplate('AI Writer', 'Generate text content with AI', 'You are a professional content writer. Generate high-quality, engaging content based on the user input. Be creative and detailed.', 'Describe what you want to write...', 'Generate Content'),
  'ai-detector': aiToolTemplate('AI Detector', 'Detect if text was written by AI', 'You are an AI text detector. Analyze the provided text and determine if it was likely written by an AI or a human. Provide a percentage likelihood and explain your reasoning.', 'Paste text to analyze...', 'Detect AI Content'),
  'sentiment-analyzer': aiToolTemplate('Sentiment Analyzer', 'Analyze text sentiment with AI', 'You are a sentiment analysis expert. Analyze the sentiment of the provided text. Determine if it is Positive, Negative, or Neutral, provide a confidence percentage, and explain the key sentiment indicators.', 'Paste text to analyze sentiment...', 'Analyze Sentiment'),
  'ai-paraphraser': aiToolTemplate('AI Paraphraser', 'Paraphrase text with AI', 'You are a paraphrasing expert. Rewrite the provided text using different words and sentence structures while preserving the original meaning. Return only the paraphrased text.', 'Paste text to paraphrase...', 'Paraphrase'),
  'keyword-extractor': aiToolTemplate('Keyword Extractor', 'Extract keywords from text with AI', 'You are a keyword extraction expert. Extract the most important keywords and key phrases from the provided text. Return them as a numbered list with brief explanations of why each is important.', 'Paste text to extract keywords...', 'Extract Keywords'),
  'email-generator': aiToolTemplate('Email Generator', 'Generate professional emails with AI', 'You are a professional email writer. Generate a well-structured, professional email based on the user description. Include subject line, greeting, body, and closing.', 'Describe the email you need...', 'Generate Email'),
  'ai-chatbot': aiToolTemplate('AI Chatbot', 'Chat with an AI assistant', 'You are a helpful, friendly AI assistant. Answer questions and help with tasks in a conversational way.', 'Ask me anything...', 'Send Message'),
  'image-captioner': aiToolTemplate('Image Captioner', 'Generate captions for images', 'You are an image captioning expert. Generate creative, descriptive captions for images. Since this is text-based, help the user write captions based on their image description.', 'Describe your image and I will generate a caption...', 'Generate Caption'),
  'data-extractor': aiToolTemplate('Data Extractor', 'Extract data from text with AI', 'You are a data extraction expert. Extract structured data from the provided text. Format the extracted data in a clear, organized way (JSON or table format when appropriate).', 'Paste text to extract data from...', 'Extract Data'),
  'audio-transcriber': aiToolTemplate('Audio Transcriber', 'Transcribe audio content with AI', 'You are a transcription assistant. Help users with audio transcription tasks. If they provide text notes or partial transcriptions, help them clean up and format the transcript.', 'Paste partial transcript or notes to clean up...', 'Clean Transcript'),
  'background-remover': `'use client';
import { useState, useRef } from 'react';
export default function BackgroundRemoverPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); };

  const removeBackground = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bg = { r: data.data[0], g: data.data[1], b: data.data[2] };
        const tolerance = 30;
        for (let i = 0; i < data.data.length; i += 4) {
          const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
          if (Math.abs(r-bg.r)<tolerance && Math.abs(g-bg.g)<tolerance && Math.abs(b-bg.b)<tolerance) data.data[i+3] = 0;
        }
        ctx.putImageData(data, 0, 0);
        setResult(canvas.toDataURL('image/png'));
        setLoading(false);
      };
      img.src = image;
    } catch(e) { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Background Remover</h1>
        <p className="text-neutral-400 text-center mb-8">Remove image backgrounds automatically</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={removeBackground} disabled={!image || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Processing...' : 'Remove Background'}</button>
          {result && (
            <div className="space-y-2">
              <div className="bg-checkered rounded-xl overflow-hidden" style={{backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'}}>
                <img src={result} className="max-h-48 mx-auto" />
              </div>
              <a href={result} download="no-background.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download PNG</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'image-upscaler': `'use client';
import { useState, useRef } from 'react';
export default function ImageUpscalerPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [scale, setScale] = useState(2);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); setInfo(null); };

  const upscale = () => {
    if (!image) return;
    setLoading(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setResult(canvas.toDataURL('image/png'));
      setInfo({ original: img.width + 'x' + img.height, upscaled: canvas.width + 'x' + canvas.height });
      setLoading(false);
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Upscaler</h1>
        <p className="text-neutral-400 text-center mb-8">Upscale images to higher resolution</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-2">Scale Factor</label><div className="flex gap-2">{[2,3,4].map(s => <button key={s} onClick={() => setScale(s)} className={"flex-1 py-2 rounded-lg font-semibold transition " + (scale===s?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-700')}>{s}x</button>)}</div></div>
          <button onClick={upscale} disabled={!image || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Upscaling...' : 'Upscale Image'}</button>
          {info && <div className="grid grid-cols-2 gap-3 text-center"><div className="bg-neutral-800 rounded-xl p-3"><div className="text-neutral-400 text-xs">Original</div><div className="font-bold">{info.original}</div></div><div className="bg-neutral-800 rounded-xl p-3"><div className="text-neutral-400 text-xs">Upscaled</div><div className="font-bold text-indigo-400">{info.upscaled}</div></div></div>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="upscaled.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,
};

Object.entries(tools).forEach(([name, content]) => {
  const dir = path.join(basePath, name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.jsx'), content, 'utf8');
  console.log('Created: ' + path.join(dir, 'page.jsx'));
});

console.log('All AI tools created!');