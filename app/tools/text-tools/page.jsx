'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, groupTextColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Word Counter', description: 'Count words, characters and sentences', href: '/tools/text-tools/word-counter', group: 'Count & Analyze' },
  { title: 'Case Converter', description: 'Convert text to upper, lower, title case', href: '/tools/text-tools/case-converter', group: 'Transform & Format' },
  { title: 'Text Reverser', description: 'Reverse any text or sentence', href: '/tools/text-tools/text-reverser', group: 'Transform & Format' },
  { title: 'Duplicate Remover', description: 'Remove duplicate lines from text', href: '/tools/text-tools/duplicate-remover', group: 'Transform & Format' },
  { title: 'Text Sorter', description: 'Sort lines alphabetically', href: '/tools/text-tools/text-sorter', group: 'Transform & Format' },
  { title: 'Find and Replace', description: 'Find and replace text instantly', href: '/tools/text-tools/find-replace', group: 'Find & Secure' },
  { title: 'Text Comparator', description: 'Compare two texts side by side', href: '/tools/text-tools/text-comparator', group: 'Count & Analyze' },
  { title: 'Whitespace Remover', description: 'Remove extra spaces from text', href: '/tools/text-tools/whitespace-remover', group: 'Transform & Format' },
  { title: 'Lorem Ipsum Generator', description: 'Generate placeholder text', href: '/tools/text-tools/lorem-ipsum', group: 'Generate & Create' },
  { title: 'URL Encoder', description: 'Encode and decode URLs', href: '/tools/text-tools/url-encoder', group: 'Find & Secure' },
  { title: 'Text to List', description: 'Convert text to bullet list', href: '/tools/text-tools/text-to-list', group: 'Transform & Format' },
  { title: 'Text Truncator', description: 'Truncate text to specific length', href: '/tools/text-tools/text-truncator', group: 'Transform & Format' },
  { title: 'Text Repeater', description: 'Repeat text multiple times', href: '/tools/text-tools/text-repeater', group: 'Transform & Format' },
  { title: 'Character Counter', description: 'Count characters in real time', href: '/tools/text-tools/character-counter', group: 'Count & Analyze' },
  { title: 'Text Encryptor', description: 'Encrypt and decrypt text', href: '/tools/text-tools/text-encryptor', group: 'Find & Secure' },
  { title: 'ASCII Art Generator', description: 'Convert text to ASCII art', href: '/tools/text-tools/ascii-art', group: 'Generate & Create' },
  { title: 'Sticky Notes', description: 'Create and save sticky notes', href: '/tools/text-tools/sticky-notes', group: 'Generate & Create' },
];

export default function TextToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="text-tools" className="w-8 h-8 text-green-500" /> Text Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your text tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${groupTextColors[tool.group]}`} />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text Tools is a free online suite of powerful utilities designed to help you manipulate, analyze, and transform text instantly without any downloads or installations required. Whether you need to count words, convert case, remove duplicates, or format text, Text Tools provides fast and efficient solutions for all your text processing needs.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Text Tools website and select the specific tool you need from the available options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste or type your text into the input field provided in the tool interface</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Configure any additional settings or options relevant to your chosen tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the process button to instantly generate your results and copy the output to your clipboard</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text Tools completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Tools is entirely free with no hidden charges, subscriptions, or premium features required to access any of the tools.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Text Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account creation is necessary. You can use all Text Tools features immediately without signing up or providing personal information.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my text data safe and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your text data is processed locally in your browser and is never stored on our servers, ensuring complete privacy and security.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which text tools are available in the suite?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Text Tools includes word counters, case converters, duplicate removers, text formatters, character counters, and many other useful utilities.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the word count tool before submitting documents to ensure you meet specific length requirements for essays, articles, or applications</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Leverage the case converter to quickly standardize text formatting across multiple documents or to create consistent titles and headings</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the duplicate remover tool to clean up lists and eliminate repetitive entries from data imports or manual compilations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark Text Tools in your browser for quick access and consider sharing it with colleagues who frequently need text processing assistance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}