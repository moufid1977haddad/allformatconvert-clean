const fs = require('fs');
const path = require('path');

const tools = {
  'background-remover': 'Background Remover',
  'image-upscaler': 'Image Upscaler',
  'grammar-fixer': 'Grammar Fixer',
  'text-summarizer': 'Text Summarizer',
  'ai-translator': 'AI Translator',
  'image-generator': 'Image Generator',
  'ai-chatbot': 'AI Chatbot',
  'ai-writer': 'AI Writer',
  'ai-detector': 'AI Detector',
  'audio-transcriber': 'Audio Transcriber',
  'sentiment-analyzer': 'Sentiment Analyzer',
  'image-captioner': 'Image Captioner',
  'data-extractor': 'Data Extractor',
  'ai-paraphraser': 'AI Paraphraser',
  'email-generator': 'Email Generator',
  'keyword-extractor': 'Keyword Extractor',
};

const basePath = 'app/tools/ai-tools';

Object.entries(tools).forEach(([slug, title]) => {
  const dir = path.join(basePath, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const content = `'use client';
export default function ${title.replace(/\s+/g, '')}Page() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-6">🤖</div>
        <h1 className="text-3xl font-bold mb-4">${title}</h1>
        <p className="text-neutral-400 mb-8">This AI tool is coming soon. We are working hard to bring you the best experience.</p>
        <div className="bg-neutral-900 rounded-xl p-8 space-y-4">
          <div className="text-indigo-400 text-xl font-semibold">Coming Soon</div>
          <p className="text-neutral-500 text-sm">We are integrating advanced AI models to power this tool. Stay tuned for updates.</p>
        </div>
      </div>
    </div>
  );
}`;
  fs.writeFileSync(path.join(dir, 'page.jsx'), content, 'utf8');
  console.log('Created: ' + path.join(dir, 'page.jsx'));
});

console.log('All AI tools created!');