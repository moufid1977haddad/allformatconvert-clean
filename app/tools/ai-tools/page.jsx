'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Background Remover', description: 'Cut out the subject of a photo as a transparent PNG', href: '/tools/ai-tools/background-remover', group: 'Image AI' },
  { title: 'Image Upscaler', description: 'Enlarge a JPG, PNG or WebP image 2× or 4×', href: '/tools/ai-tools/image-upscaler', group: 'Image AI' },
  { title: 'Grammar Fixer', description: 'Fix spelling and grammar, with each change shown', href: '/tools/ai-tools/grammar-fixer', group: 'Writing & Language' },
  { title: 'Text Summarizer', description: 'Shorten a long text to its key points', href: '/tools/ai-tools/text-summarizer', group: 'Writing & Language' },
  { title: 'AI Translator', description: 'Translate text into one of 10 languages', href: '/tools/ai-tools/ai-translator', group: 'Chat, Translate & Generate' },
  { title: 'Image Generator', description: 'Create one image from a written description', href: '/tools/ai-tools/image-generator', group: 'Image AI' },
  { title: 'AI Chatbot', description: 'Ask questions to GPT-4o mini in a chat', href: '/tools/ai-tools/ai-chatbot', group: 'Chat, Translate & Generate' },
  { title: 'AI Writer', description: 'Draft a text from a short description', href: '/tools/ai-tools/ai-writer', group: 'Writing & Language' },
  { title: 'AI Detector', description: 'Estimate whether a text was written by AI, with Pangram', href: '/tools/ai-tools/ai-detector', group: 'Writing & Language' },
  { title: 'Audio Transcriber', description: 'Audio to text, SRT and VTT with OpenAI Whisper', href: '/tools/ai-tools/audio-transcriber', group: 'Audio & Data Analysis' },
  { title: 'Sentiment Analyzer', description: 'Rate a text Positive, Negative or Neutral', href: '/tools/ai-tools/sentiment-analyzer', group: 'Audio & Data Analysis' },
  { title: 'Image Captioner', description: 'Write a description of an image', href: '/tools/ai-tools/image-captioner', group: 'Image AI' },
  { title: 'Data Extractor', description: 'Pull names, dates and prices out of pasted text', href: '/tools/ai-tools/data-extractor', group: 'Audio & Data Analysis' },
  { title: 'AI Paraphraser', description: 'Reword a text and keep its meaning', href: '/tools/ai-tools/ai-paraphraser', group: 'Writing & Language' },
  { title: 'Email Generator', description: 'Write a full email from a description and a tone', href: '/tools/ai-tools/email-generator', group: 'Chat, Translate & Generate' },
  { title: 'Keyword Extractor', description: 'List the key words and phrases of a text', href: '/tools/ai-tools/keyword-extractor', group: 'Audio & Data Analysis' },
];

export default function AiToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="ai-tools" className={`w-8 h-8 ${categoryColors['ai-tools']}`} /> AI Tools</h1>
        <p className="text-neutral-500 text-center mb-10">AI models for text, images and audio - {tools.filter(t => !t.comingSoon).length} tools</p>
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
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">These tools hand the work to an AI model. Thirteen of them send what you submit through our server to OpenAI: GPT-4o mini for text and image descriptions, Whisper for audio, gpt-image-2 for new pictures. AI Detector sends your text to Pangram Labs. Background Remover and Image Upscaler use our own AI services instead, and the upscaler runs on your device when your browser has WebGPU. Results are text to copy or save as .txt, PNG or WebP images, or TXT, SRT and VTT transcripts.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use AI Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Pick the tool by what you give it: text for the writing and analysis tools, a photo for Background Remover, Image Upscaler or Image Captioner, an audio file for Audio Transcriber.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Check the limit shown on the tool page, such as 40 to 1,000 words per analysis in AI Detector or 25 MB per file in Audio Transcriber.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Run the tool and read the output before you use it: a model can make mistakes, invent facts or misjudge a text.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the result or download it: a .txt file from the writing tools, a PNG from Background Remover and Image Upscaler, WebP or PNG from Image Generator.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit on how much I can use the AI tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes. The OpenAI tools and Background Remover share an hourly and a daily allowance per connection, under a monthly budget for the site. AI Detector has its own allowance of 2,000 words a day per visitor, Image Generator 5 images a day, and Image Upscaler counts its server jobs per connection. The page says when a limit is reached and when to try again.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which company receives what I submit?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">OpenAI, for 13 of these 16 tools: your text, image or audio goes through our server to its API. AI Detector sends text to Pangram Labs. Background Remover sends a JPEG copy of at most 1,024 px to our own service, and Image Upscaler uses our server when it cannot run on your device. We do not save what you send; what OpenAI and Pangram keep is set by their terms.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can the AI tools read a PDF or a Word file?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No. The writing and analysis tools take typed or pasted text only. For a PDF, use AI PDF Summary or Translate PDF in PDF Tools; AI PDF Summary extracts the text on your device instead of uploading the file, and sends only that text to OpenAI.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long can my text be?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">8,000 characters per request for the OpenAI text tools, and replies stop at 1,000 tokens, a few paragraphs. AI Detector takes 40 to 1,000 words per analysis, and Image Generator a description of up to 1,000 characters.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>To transcribe a video, extract its sound with Video to Audio, then upload the audio file to Audio Transcriber.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Grammar Fixer marks every change; undo the ones you disagree with before you copy the corrected text.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Split an essay longer than 1,000 words into parts for AI Detector and compare the verdicts of each part.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If a photo is too large for Image Upscaler, reduce it first with Image Resizer.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}