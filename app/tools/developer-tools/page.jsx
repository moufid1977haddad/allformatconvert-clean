'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, groupTextColors } from '../../lib/toolIcons';

const tools = [
  { title: 'XML to JSON', description: 'Convert XML to JSON format', href: '/tools/developer-tools/xml-to-json', group: 'Data Format Convert' },
  { title: 'JSON to XML', description: 'Convert JSON to XML format', href: '/tools/developer-tools/json-to-xml', group: 'JSON Tools' },
  { title: 'TSV to CSV', description: 'Convert TSV to CSV format', href: '/tools/developer-tools/tsv-to-csv', group: 'Data Format Convert' },
  { title: 'CSV to TSV', description: 'Convert CSV to TSV format', href: '/tools/developer-tools/csv-to-tsv', group: 'Data Format Convert' },
  { title: 'Excel to JSON', description: 'Convert Excel files to JSON', href: '/tools/developer-tools/excel-to-json', group: 'Data Format Convert' },
  { title: 'Excel to CSV', description: 'Convert Excel files to CSV', href: '/tools/developer-tools/excel-to-csv', group: 'Data Format Convert' },
  { title: 'CSV to Excel', description: 'Convert CSV to Excel format', href: '/tools/developer-tools/csv-to-excel', group: 'Data Format Convert' },
  { title: 'TOML to JSON', description: 'Convert TOML to JSON format', href: '/tools/developer-tools/toml-to-json', group: 'Data Format Convert' },
  { title: 'JSON to TOML', description: 'Convert JSON to TOML format', href: '/tools/developer-tools/json-to-toml', group: 'JSON Tools' },
  { title: 'JSON Formatter', description: 'Format and validate JSON', href: '/tools/developer-tools/json-formatter', group: 'JSON Tools' },
  { title: 'JSON Minifier', description: 'Minify JSON data', href: '/tools/developer-tools/json-minifier', group: 'JSON Tools' },
  { title: 'UUID Generator', description: 'Generate unique UUIDs', href: '/tools/developer-tools/uuid-generator', group: 'Generators & Security' },
  { title: 'Lorem Ipsum', description: 'Generate placeholder text', href: '/tools/text-tools/lorem-ipsum', group: 'Generate & Create' },
  { title: 'Base64 Encoder', description: 'Encode and decode Base64', href: '/tools/developer-tools/base64-encoder', group: 'Web & Text Encoding' },
  { title: 'URL Encoder', description: 'Encode and decode URLs', href: '/tools/developer-tools/url-encoder', group: 'Web & Text Encoding' },
  { title: 'Hash Generator', description: 'Generate SHA hashes', href: '/tools/developer-tools/hash-generator', group: 'Generators & Security' },
  { title: 'Password Generator', description: 'Generate secure passwords', href: '/tools/developer-tools/password-generator', group: 'Generators & Security' },
  { title: 'CSV to JSON', description: 'Convert CSV to JSON', href: '/tools/developer-tools/csv-to-json', group: 'Data Format Convert' },
  { title: 'JSON to CSV', description: 'Convert JSON to CSV', href: '/tools/developer-tools/json-to-csv', group: 'JSON Tools' },
  { title: 'CSS Formatter', description: 'Format and beautify CSS', href: '/tools/developer-tools/css-formatter', group: 'Code Formatting' },
  { title: 'HTML Formatter', description: 'Format and beautify HTML', href: '/tools/developer-tools/html-formatter', group: 'Web & Text Encoding' },
  { title: 'JS Minifier', description: 'Minify JavaScript code', href: '/tools/developer-tools/js-minifier', group: 'Code Formatting' },
  { title: 'JavaScript Formatter', description: 'Format JavaScript code', href: '/tools/developer-tools/javascript-formatter', group: 'Code Formatting' },
  { title: 'SCSS to CSS', description: 'Convert SCSS to CSS', href: '/tools/developer-tools/scss-to-css', group: 'Code Formatting' },
  { title: 'TypeScript to JS', description: 'Strip TypeScript types', href: '/tools/developer-tools/typescript-to-js', group: 'Code Formatting' },
  { title: 'XML Formatter', description: 'Format and beautify XML', href: '/tools/developer-tools/xml-formatter', group: 'Data Format Convert' },
  { title: 'SQL Formatter', description: 'Format SQL queries', href: '/tools/developer-tools/sql-formatter', group: 'Code Formatting' },
  { title: 'Regex Tester', description: 'Test regular expressions', href: '/tools/developer-tools/regex-tester', group: 'Generators & Security' },
  { title: 'Markdown Previewer', description: 'Preview Markdown in real time', href: '/tools/developer-tools/markdown-previewer', group: 'Code Formatting' },
  { title: 'Markdown to HTML', description: 'Convert Markdown to HTML', href: '/tools/developer-tools/markdown-to-html', group: 'Code Formatting' },
  { title: 'JWT Decoder', description: 'Decode JWT tokens', href: '/tools/developer-tools/jwt-decoder', group: 'Generators & Security' },
  { title: 'Markdown Editor', description: 'Write and preview Markdown', href: '/tools/developer-tools/markdown-editor', group: 'Code Formatting' },
  { title: 'API Tester', description: 'Test REST API endpoints', href: '/tools/developer-tools/api-tester', group: 'Utilities' },
  { title: 'Number Base Converter', description: 'Convert between number bases', href: '/tools/developer-tools/number-base-converter', group: 'Utilities' },
  { title: 'YAML to JSON', description: 'Convert YAML to JSON', href: '/tools/developer-tools/yaml-to-json', group: 'Data Format Convert' },
  { title: 'JSON to YAML', description: 'Convert JSON to YAML', href: '/tools/developer-tools/json-to-yaml', group: 'JSON Tools' },
  { title: 'Color Picker', description: 'Pick and convert colors', href: '/tools/developer-tools/color-picker', group: 'Utilities' },
  { title: 'Timestamp Converter', description: 'Convert Unix timestamps', href: '/tools/developer-tools/timestamp-converter', group: 'Utilities' },
  { title: 'Aspect Ratio', description: 'Calculate aspect ratios', href: '/tools/developer-tools/aspect-ratio', group: 'Utilities' },
  { title: 'URL Parser', description: 'Parse and analyze URLs', href: '/tools/developer-tools/url-parser', group: 'Web & Text Encoding' },
  { title: 'HTML Encoder', description: 'Encode and decode HTML entities', href: '/tools/developer-tools/html-encoder', group: 'Web & Text Encoding' },
  { title: 'HTML Entity Decoder', description: 'Decode HTML entities', href: '/tools/developer-tools/html-entity-decoder', group: 'Web & Text Encoding' },
  { title: 'Unicode Converter', description: 'Convert text to Unicode', href: '/tools/developer-tools/unicode-converter', group: 'Web & Text Encoding' },
  { title: 'Hex to Text', description: 'Convert between text and hex', href: '/tools/developer-tools/hex-to-text', group: 'Web & Text Encoding' },
  { title: 'JSON to TypeScript', description: 'Generate TypeScript interfaces', href: '/tools/developer-tools/json-to-typescript', group: 'JSON Tools' },
  { title: 'JSON to Go Struct', description: 'Generate Go structs from JSON', href: '/tools/developer-tools/json-to-go', group: 'JSON Tools' },
  { title: 'JSON to Rust Struct', description: 'Generate Rust structs from JSON', href: '/tools/developer-tools/json-to-rust', group: 'JSON Tools' },
  { title: 'JSON to Python Class', description: 'Generate Python dataclasses', href: '/tools/developer-tools/json-to-python', group: 'JSON Tools' },
  { title: 'JSON to PHP Class', description: 'Generate PHP classes from JSON', href: '/tools/developer-tools/json-to-php', group: 'JSON Tools' },
  { title: 'JSON to C# Class', description: 'Generate C# classes from JSON', href: '/tools/developer-tools/json-to-csharp', group: 'JSON Tools' },
  { title: 'CSV to SQL', description: 'Generate SQL from CSV', href: '/tools/developer-tools/csv-to-sql', group: 'Data Format Convert' },
  { title: 'SQL to CSV', description: 'Extract data from SQL to CSV', href: '/tools/developer-tools/sql-to-csv', group: 'Data Format Convert' },
  { title: '.env to JSON', description: 'Convert .env files to JSON', href: '/tools/developer-tools/env-to-json', group: 'Utilities' },
  { title: 'Code Minifier', description: 'Minify JS, CSS, HTML code', href: '/tools/developer-tools/code-minifier', group: 'Code Formatting' },
  { title: 'Diff Viewer', description: 'Compare two texts', href: '/tools/developer-tools/diff-viewer', group: 'Generators & Security' },
  { title: 'Code Formatter', description: 'Format and beautify code', href: '/tools/developer-tools/code-formatter', group: 'Code Formatting' },
  { title: 'Cron Expression Builder', description: 'Build cron expressions', href: '/tools/developer-tools/cron-expression-builder', group: 'Utilities' },
];

export default function DeveloperToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="developer-tools" className="w-8 h-8 text-purple-500" /> Developer Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your developer tools in one place - {tools.length} tools</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Developer Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Developer Tools is a comprehensive free online suite designed to help programmers, web developers, and tech professionals streamline their workflow with essential utilities. From code formatting and API testing to debugging and performance analysis, this all-in-one platform eliminates the need for multiple subscriptions and installations.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Developer Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Navigate to the Developer Tools website and select the specific tool you need from the main dashboard menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Input your code, data, or configuration into the provided text area or upload your file directly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Configure any optional settings or parameters relevant to your task using the intuitive control panel</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the execute or process button to run the tool and instantly view results in the output section</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Developer Tools really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all core features of Developer Tools are completely free with no hidden charges, registration requirements, or usage limits.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install software to use Developer Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Developer Tools is entirely web-based and runs directly in your browser, requiring no downloads or installations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my code and data secure when using Developer Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all data is processed locally in your browser or on secure servers with encryption, and we never store or share your personal code or information.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What programming languages does Developer Tools support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Developer Tools supports all major languages including JavaScript, Python, Java, C++, PHP, Ruby, Go, and many others across various utility functions.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark Developer Tools for quick access and save time on repetitive development tasks throughout your workflow</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Explore the batch processing feature to handle multiple files at once, significantly increasing your productivity</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use keyboard shortcuts to speed up navigation between different tools within the platform</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check the documentation and tutorial section regularly to discover new features and advanced techniques for maximizing tool capabilities</li>
          </ul>
        </div>
      </div>
    </div>
  );
}