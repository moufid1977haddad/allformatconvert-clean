'use client';
import Link from 'next/link';

const tools = [
  { icon: '🔢', title: 'Word Counter', description: 'Count words, characters and sentences', href: '/tools/text-tools/word-counter' },
  { icon: '🔤', title: 'Case Converter', description: 'Convert text to upper, lower, title case', href: '/tools/text-tools/case-converter' },
  { icon: '🔁', title: 'Text Reverser', description: 'Reverse any text or sentence', href: '/tools/text-tools/text-reverser' },
  { icon: '🗑️', title: 'Duplicate Remover', description: 'Remove duplicate lines from text', href: '/tools/text-tools/duplicate-remover' },
  { icon: '↔️', title: 'Text Sorter', description: 'Sort lines alphabetically', href: '/tools/text-tools/text-sorter' },
  { icon: '🔍', title: 'Find and Replace', description: 'Find and replace text instantly', href: '/tools/text-tools/find-replace' },
  { icon: '📊', title: 'Text Comparator', description: 'Compare two texts side by side', href: '/tools/text-tools/text-comparator' },
  { icon: '🧹', title: 'Whitespace Remover', description: 'Remove extra spaces from text', href: '/tools/text-tools/whitespace-remover' },
  { icon: '📝', title: 'Lorem Ipsum Generator', description: 'Generate placeholder text', href: '/tools/text-tools/lorem-ipsum' },
  { icon: '🌐', title: 'URL Encoder', description: 'Encode and decode URLs', href: '/tools/text-tools/url-encoder' },
  { icon: '📋', title: 'Text to List', description: 'Convert text to bullet list', href: '/tools/text-tools/text-to-list' },
  { icon: '📏', title: 'Text Truncator', description: 'Truncate text to specific length', href: '/tools/text-tools/text-truncator' },
  { icon: '🔠', title: 'Text Repeater', description: 'Repeat text multiple times', href: '/tools/text-tools/text-repeater' },
  { icon: '🧮', title: 'Character Counter', description: 'Count characters in real time', href: '/tools/text-tools/character-counter' },
  { icon: '🔐', title: 'Text Encryptor', description: 'Encrypt and decrypt text', href: '/tools/text-tools/text-encryptor' },
  { icon: '🔣', title: 'ASCII Art Generator', description: 'Convert text to ASCII art', href: '/tools/text-tools/ascii-art' },
  { icon: '📌', title: 'Sticky Notes', description: 'Create and save sticky notes', href: '/tools/text-tools/sticky-notes' },
];

export default function TextToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">📝 Text Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your text tools in one place - {tools.length} tools</p>
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
