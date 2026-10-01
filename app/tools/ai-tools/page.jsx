'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Background Remover', description: 'Remove image backgrounds with AI', href: '/tools/ai-tools/background-remover', group: 'Image AI' },
  { title: 'Image Upscaler', description: 'Upscale images with AI', href: '/tools/ai-tools/image-upscaler', group: 'Image AI' },
  { title: 'Grammar Fixer', description: 'Fix grammar and spelling with AI', href: '/tools/ai-tools/grammar-fixer', group: 'Writing & Language' },
  { title: 'Text Summarizer', description: 'Summarize long texts with AI', href: '/tools/ai-tools/text-summarizer', group: 'Writing & Language' },
  { title: 'AI Translator', description: 'Translate text with AI', href: '/tools/ai-tools/ai-translator', group: 'Chat, Translate & Generate' },
  { title: 'Image Generator', description: 'Generate images with AI', href: '/tools/ai-tools/image-generator', group: 'Image AI' },
  { title: 'AI Chatbot', description: 'Chat with an AI assistant', href: '/tools/ai-tools/ai-chatbot', group: 'Chat, Translate & Generate' },
  { title: 'AI Writer', description: 'Generate text content with AI', href: '/tools/ai-tools/ai-writer', group: 'Writing & Language' },
  { title: 'AI Detector', description: 'Detect AI-generated content', href: '/tools/ai-tools/ai-detector', group: 'Writing & Language' },
  { title: 'Audio Transcriber', description: 'Transcribe audio to text with AI', href: '/tools/ai-tools/audio-transcriber', group: 'Audio & Data Analysis' },
  { title: 'Sentiment Analyzer', description: 'Analyze text sentiment with AI', href: '/tools/ai-tools/sentiment-analyzer', group: 'Audio & Data Analysis' },
  { title: 'Image Captioner', description: 'Generate captions for images', href: '/tools/ai-tools/image-captioner', group: 'Image AI' },
  { title: 'Data Extractor', description: 'Extract data from documents with AI', href: '/tools/ai-tools/data-extractor', group: 'Audio & Data Analysis' },
  { title: 'AI Paraphraser', description: 'Paraphrase text with AI', href: '/tools/ai-tools/ai-paraphraser', group: 'Writing & Language' },
  { title: 'Email Generator', description: 'Generate professional emails with AI', href: '/tools/ai-tools/email-generator', group: 'Chat, Translate & Generate' },
  { title: 'Keyword Extractor', description: 'Extract keywords from text with AI', href: '/tools/ai-tools/keyword-extractor', group: 'Audio & Data Analysis' },
];

export default function AiToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="ai-tools" className={`w-8 h-8 ${categoryColors['ai-tools']}`} /> AI Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your AI tools in one place - {tools.filter(t => !t.comingSoon).length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolTextColors[tool.href]}`} />
              {tool.comingSoon && <span className="mb-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Coming soon</span>}
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About AI Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">AI Tools is a comprehensive free online platform that provides access to powerful artificial intelligence utilities for productivity, content creation, and data analysis. Whether you're a student, professional, or business owner, AI Tools helps you automate tasks and enhance your work without any subscription fees.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use AI Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the AI Tools website and browse the available tools from the home page dashboard</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select the specific AI tool you want to use and click on it to open the tool interface</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Input your data, text, or parameters according to the tool's requirements and instructions</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the process or generate button to run the AI tool and download or copy your results</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is AI Tools completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes. Every AI tool is free, with no payment, registration or subscription. Because each request costs us money at the AI provider, there is an hourly and daily limit per connection (AI Detector: 2,000 words a day; Image Generator: 5 images a day); the page tells you when you reach it and when to come back.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use AI Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No. No tool requires an account: you can use AI Tools immediately without signing up or providing personal information.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What types of AI tools are available on the platform?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">AI Tools covers writing (AI Writer, Paraphraser, Grammar Fixer, Email Generator, Translator, Summarizer), text analysis (AI Detector, Keyword Extractor, Sentiment Analyzer, Data Extractor), a chatbot, images (Background Remover, Image Upscaler, Image Captioner, Image Generator) and audio transcription.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe and private when using AI Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The AI tools need an AI model on a server: the text, image or audio you submit is sent through our server to OpenAI (Pangram Labs for AI Detector), used only to produce your result, and not kept by us. OpenAI does not use API data to train its models. Background Remover and AI Image Upscaler use our own server instead (the upscaler runs on your device when your browser supports WebGPU). We never sell your data. Each tool is listed in our privacy policy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different AI tools to discover which ones work best for your specific needs and workflow</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Provide clear and detailed input instructions to get the most accurate and relevant results from the AI tools</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark your favorite tools for quick access and save time on future visits to the platform</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check back regularly as new AI tools are frequently added to expand the platform's capabilities and features</li>
          </ul>
        </div>
      </div>
    </div>
  );
}