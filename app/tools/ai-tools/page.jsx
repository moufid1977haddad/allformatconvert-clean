'use client';
import Link from 'next/link';

const tools = [
  { icon: '🖼️', title: 'Background Remover', description: 'Remove image backgrounds with AI', href: '/tools/ai-tools/background-remover' },
  { icon: '📈', title: 'Image Upscaler', description: 'Upscale images with AI', href: '/tools/ai-tools/image-upscaler' },
  { icon: '✍️', title: 'Grammar Fixer', description: 'Fix grammar and spelling with AI', href: '/tools/ai-tools/grammar-fixer' },
  { icon: '📝', title: 'Text Summarizer', description: 'Summarize long texts with AI', href: '/tools/ai-tools/text-summarizer' },
  { icon: '🌐', title: 'AI Translator', description: 'Translate text with AI', href: '/tools/ai-tools/ai-translator' },
  { icon: '🎨', title: 'Image Generator', description: 'Generate images with AI', href: '/tools/ai-tools/image-generator' },
  { icon: '💬', title: 'AI Chatbot', description: 'Chat with an AI assistant', href: '/tools/ai-tools/ai-chatbot' },
  { icon: '📄', title: 'AI Writer', description: 'Generate text content with AI', href: '/tools/ai-tools/ai-writer' },
  { icon: '🔍', title: 'AI Detector', description: 'Detect AI-generated content', href: '/tools/ai-tools/ai-detector' },
  { icon: '🎵', title: 'Audio Transcriber', description: 'Transcribe audio to text with AI', href: '/tools/ai-tools/audio-transcriber' },
  { icon: '😊', title: 'Sentiment Analyzer', description: 'Analyze text sentiment with AI', href: '/tools/ai-tools/sentiment-analyzer' },
  { icon: '🏷️', title: 'Image Captioner', description: 'Generate captions for images', href: '/tools/ai-tools/image-captioner' },
  { icon: '📊', title: 'Data Extractor', description: 'Extract data from documents with AI', href: '/tools/ai-tools/data-extractor' },
  { icon: '🔤', title: 'AI Paraphraser', description: 'Paraphrase text with AI', href: '/tools/ai-tools/ai-paraphraser' },
  { icon: '📧', title: 'Email Generator', description: 'Generate professional emails with AI', href: '/tools/ai-tools/email-generator' },
  { icon: '🎯', title: 'Keyword Extractor', description: 'Extract keywords from text with AI', href: '/tools/ai-tools/keyword-extractor' },
];

export default function AiToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">🤖 AI Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your AI tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
