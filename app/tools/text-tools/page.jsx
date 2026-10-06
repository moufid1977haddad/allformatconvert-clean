'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Word Counter', description: 'Words, sentences, reading time, keyword density', href: '/tools/text-tools/word-counter', group: 'Count & Analyze' },
  { title: 'Case Converter', description: '12 cases, from Title Case to snake_case', href: '/tools/text-tools/case-converter', group: 'Transform & Format' },
  { title: 'Text Reverser', description: 'Reverse characters, word order or lines', href: '/tools/text-tools/text-reverser', group: 'Transform & Format' },
  { title: 'Duplicate Remover', description: 'Delete repeated lines, keep the first one', href: '/tools/text-tools/duplicate-remover', group: 'Transform & Format' },
  { title: 'Text Sorter', description: 'Sort lines A-Z, by length or number, or shuffle', href: '/tools/text-tools/text-sorter', group: 'Transform & Format' },
  { title: 'Find and Replace', description: 'Replace plain text or regular expression matches', href: '/tools/text-tools/find-replace', group: 'Find & Secure' },
  { title: 'Text Comparator', description: 'Side-by-side diff with changed words marked', href: '/tools/text-tools/text-comparator', group: 'Count & Analyze' },
  { title: 'Whitespace Remover', description: 'Strip extra spaces, blank lines or line breaks', href: '/tools/text-tools/whitespace-remover', group: 'Transform & Format' },
  { title: 'Lorem Ipsum Generator', description: 'Lorem ipsum by paragraphs, sentences or words', href: '/tools/text-tools/lorem-ipsum', group: 'Generate & Create' },
  { title: 'URL Encoder', description: 'Percent-encode or decode text in three modes', href: '/tools/text-tools/url-encoder', group: 'Find & Secure' },
  { title: 'Text to List', description: 'Lines to bullets, numbers or a comma list', href: '/tools/text-tools/text-to-list', group: 'Transform & Format' },
  { title: 'Text Truncator', description: 'Cut a text to N characters or N words', href: '/tools/text-tools/text-truncator', group: 'Transform & Format' },
  { title: 'Text Repeater', description: 'Repeat a text 1 to 100 times', href: '/tools/text-tools/text-repeater', group: 'Transform & Format' },
  { title: 'Character Counter', description: 'Letters, digits, spaces and UTF-8 bytes', href: '/tools/text-tools/character-counter', group: 'Count & Analyze' },
  { title: 'Text Encryptor', description: 'Encrypt text with a password (AES-256-GCM)', href: '/tools/text-tools/text-encryptor', group: 'Find & Secure' },
  { title: 'ASCII Art Generator', description: 'A text banner in 10 FIGlet fonts', href: '/tools/text-tools/ascii-art', group: 'Generate & Create' },
  { title: 'Sticky Notes', description: 'Colored notes saved in this browser', href: '/tools/text-tools/sticky-notes', group: 'Generate & Create' },
];

export default function TextToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="text-tools" className={`w-8 h-8 ${categoryColors['text-tools']}`} /> Text Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Count, clean, sort and transform text - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolTextColors[tool.href]}`} />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">These tools work on text you paste or type, in your browser: counting words and characters, changing case, sorting and de-duplicating lines, cleaning spaces, finding and replacing with plain text or regular expressions, comparing two versions, and encrypting with a password. Most accept very long texts: above 1,000,000 characters, the box shows a read-only preview but the tool processes all of it. Sticky Notes keeps its notes in this browser's local storage, so another device does not see them.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Pick the tool for your task: count, change case, clean spacing, sort or de-duplicate lines, compare, or encrypt.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste or type your text in the box; Word Counter and Character Counter update as you type.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose the option, such as the case style, sort order or character limit, and apply it.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the result: Case Converter changes the text in place, while Find and Replace writes it to a separate field.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my text sent to a server?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No. The text tools on this page run in your browser. An error message shown by a tool, or a crash of the page, sends us the cleaned message, the tool name and your browser's name and version, never your text.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use regular expressions in Find and Replace?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes. With the regular expression option on, the search uses JavaScript regex syntax, and the replacement can insert captured groups with $1, $2 and so on.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will Sticky Notes keep my notes?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, in this browser only: the notes are saved in its local storage, so clearing the site's data, or opening the page in another browser or on another device, shows an empty board. Safari also deletes a site's storage after seven days of browsing without a visit.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How does Text Encryptor protect my text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">With AES-256-GCM and a key derived from your password by PBKDF2-SHA-256 at 600,000 iterations; the result is Base64 text that only the same password decrypts. A short or common password remains the weak point.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Tick "Ignore surrounding spaces" in Duplicate Remover; for doubled spaces inside lines, run Whitespace Remover first.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Text Comparator works line by line; put each sentence on its own line to see where a paragraph changed.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Text Truncator counts characters as they are displayed, so an emoji counts as one.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Case Converter's programming cases, such as camelCase and snake_case, turn a phrase into a variable name.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}