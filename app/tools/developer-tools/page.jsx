'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'XML to JSON', description: 'XML to JSON, attributes kept as @_ keys', href: '/tools/developer-tools/xml-to-json', group: 'Data Format Convert' },
  { title: 'JSON to XML', description: 'JSON to indented XML under a root element', href: '/tools/developer-tools/json-to-xml', group: 'JSON Tools' },
  { title: 'TSV to CSV', description: 'Tab-separated text to CSV, quoted where needed', href: '/tools/developer-tools/tsv-to-csv', group: 'Data Format Convert' },
  { title: 'CSV to TSV', description: 'Comma, semicolon or pipe CSV to tab-separated text', href: '/tools/developer-tools/csv-to-tsv', group: 'Data Format Convert' },
  { title: 'Excel to JSON', description: 'XLSX, XLS or ODS sheets to JSON objects', href: '/tools/developer-tools/excel-to-json', group: 'Data Format Convert' },
  { title: 'Excel to CSV', description: 'One CSV per sheet of an XLSX, XLS or ODS file', href: '/tools/developer-tools/excel-to-csv', group: 'Data Format Convert' },
  { title: 'CSV to Excel', description: 'Build an .xlsx or .xls workbook from CSV', href: '/tools/developer-tools/csv-to-excel', group: 'Data Format Convert' },
  { title: 'TOML to JSON', description: 'Parse TOML into indented JSON', href: '/tools/developer-tools/toml-to-json', group: 'Data Format Convert' },
  { title: 'JSON to TOML', description: 'Write a JSON object as TOML tables', href: '/tools/developer-tools/json-to-toml', group: 'JSON Tools' },
  { title: 'JSON Formatter', description: 'Validate JSON and indent it, keys sorted on request', href: '/tools/developer-tools/json-formatter', group: 'JSON Tools' },
  { title: 'JSON Minifier', description: 'Validate JSON and strip its whitespace', href: '/tools/developer-tools/json-minifier', group: 'JSON Tools' },
  { title: 'UUID Generator', description: 'Up to 1,000 UUIDs, version 4 or version 7', href: '/tools/developer-tools/uuid-generator', group: 'Generators & Security' },
  { title: 'Lorem Ipsum', description: 'Placeholder text by paragraphs, sentences or words', href: '/tools/text-tools/lorem-ipsum', group: 'Generate & Create' },
  { title: 'Base64 Encoder', description: 'Text to Base64 or URL-safe Base64, and back', href: '/tools/developer-tools/base64-encoder', group: 'Web & Text Encoding' },
  { title: 'URL Encoder', description: 'Percent-encode a value or a full URL, and decode', href: '/tools/developer-tools/url-encoder', group: 'Web & Text Encoding' },
  { title: 'Hash Generator', description: 'MD5, SHA, CRC32 for text and files', href: '/tools/developer-tools/hash-generator', group: 'Generators & Security' },
  { title: 'Password Generator', description: 'Random passwords or EFF word passphrases', href: '/tools/developer-tools/password-generator', group: 'Generators & Security' },
  { title: 'CSV to JSON', description: 'CSV to objects, arrays or JSON Lines', href: '/tools/developer-tools/csv-to-json', group: 'Data Format Convert' },
  { title: 'JSON to CSV', description: 'JSON array to CSV, nested keys as dotted columns', href: '/tools/developer-tools/json-to-csv', group: 'JSON Tools' },
  { title: 'CSS Formatter', description: 'Format or minify CSS', href: '/tools/developer-tools/css-formatter', group: 'Code Formatting' },
  { title: 'HTML Formatter', description: 'Re-indent HTML with its inline CSS and scripts', href: '/tools/developer-tools/html-formatter', group: 'Web & Text Encoding' },
  { title: 'JS Minifier', description: 'Minify JavaScript with Terser', href: '/tools/developer-tools/js-minifier', group: 'Code Formatting' },
  { title: 'JavaScript Formatter', description: 'Format with js-beautify or minify with Terser', href: '/tools/developer-tools/javascript-formatter', group: 'Code Formatting' },
  { title: 'SCSS to CSS', description: 'Compile SCSS to CSS with Dart Sass', href: '/tools/developer-tools/scss-to-css', group: 'Code Formatting' },
  { title: 'TypeScript to JS', description: 'Strip TypeScript types', href: '/tools/developer-tools/typescript-to-js', group: 'Code Formatting' },
  { title: 'XML Formatter', description: 'Check that XML is well-formed and indent it', href: '/tools/developer-tools/xml-formatter', group: 'Data Format Convert' },
  { title: 'SQL Formatter', description: 'Format SQL in one of 12 dialects', href: '/tools/developer-tools/sql-formatter', group: 'Code Formatting' },
  { title: 'Regex Tester', description: 'Test a JavaScript regex: matches, groups, replace', href: '/tools/developer-tools/regex-tester', group: 'Generators & Security' },
  { title: 'Markdown Previewer', description: 'See Markdown rendered as you type', href: '/tools/developer-tools/markdown-previewer', group: 'Code Formatting' },
  { title: 'Markdown to HTML', description: 'Markdown to a complete HTML5 document', href: '/tools/developer-tools/markdown-to-html', group: 'Code Formatting' },
  { title: 'JWT Decoder', description: 'Decode a JWT and verify its signature', href: '/tools/developer-tools/jwt-decoder', group: 'Generators & Security' },
  { title: 'Markdown Editor', description: 'Write Markdown, download the .md and .html', href: '/tools/developer-tools/markdown-editor', group: 'Code Formatting' },
  { title: 'API Tester', description: 'Send GET, POST, PUT, PATCH or DELETE requests', href: '/tools/developer-tools/api-tester', group: 'Utilities' },
  { title: 'Number Base Converter', description: 'Bases 2 to 36, fractions and signs included', href: '/tools/developer-tools/number-base-converter', group: 'Utilities' },
  { title: 'YAML to JSON', description: 'YAML to JSON; several documents become an array', href: '/tools/developer-tools/yaml-to-json', group: 'Data Format Convert' },
  { title: 'JSON to YAML', description: 'JSON to block-style YAML', href: '/tools/developer-tools/json-to-yaml', group: 'JSON Tools' },
  { title: 'Color Picker', description: 'Pick a color and read its HEX and RGB values', href: '/tools/developer-tools/color-picker', group: 'Utilities' },
  { title: 'Timestamp Converter', description: 'Unix time in s, ms, µs or ns to dates and back', href: '/tools/developer-tools/timestamp-converter', group: 'Utilities' },
  { title: 'Aspect Ratio', description: 'Simplify a ratio and compute the missing side', href: '/tools/developer-tools/aspect-ratio', group: 'Utilities' },
  { title: 'URL Parser', description: 'Split a URL into its parts and query parameters', href: '/tools/developer-tools/url-parser', group: 'Web & Text Encoding' },
  { title: 'HTML Encoder', description: 'Escape HTML special characters, decode entities', href: '/tools/developer-tools/html-encoder', group: 'Web & Text Encoding' },
  { title: 'HTML Entity Decoder', description: 'Decode named and numeric HTML entities', href: '/tools/developer-tools/html-entity-decoder', group: 'Web & Text Encoding' },
  { title: 'Unicode Converter', description: 'Text to UTF-16 escape sequences and back', href: '/tools/developer-tools/unicode-converter', group: 'Web & Text Encoding' },
  { title: 'Hex to Text', description: 'Text to UTF-8 bytes in hex, and back', href: '/tools/developer-tools/hex-to-text', group: 'Web & Text Encoding' },
  { title: 'JSON to TypeScript', description: 'TypeScript interfaces from a JSON sample', href: '/tools/developer-tools/json-to-typescript', group: 'JSON Tools' },
  { title: 'JSON to Go Struct', description: 'Go structs with json tags from a JSON sample', href: '/tools/developer-tools/json-to-go', group: 'JSON Tools' },
  { title: 'JSON to Rust Struct', description: 'Rust structs for serde from a JSON sample', href: '/tools/developer-tools/json-to-rust', group: 'JSON Tools' },
  { title: 'JSON to Python Class', description: 'Python dataclasses from a JSON sample', href: '/tools/developer-tools/json-to-python', group: 'JSON Tools' },
  { title: 'JSON to PHP Class', description: 'A PHP array or typed PHP 8 classes from JSON', href: '/tools/developer-tools/json-to-php', group: 'JSON Tools' },
  { title: 'JSON to C# Class', description: 'C# classes with System.Text.Json attributes', href: '/tools/developer-tools/json-to-csharp', group: 'JSON Tools' },
  { title: 'CSV to SQL', description: 'CREATE TABLE and INSERT statements from CSV', href: '/tools/developer-tools/csv-to-sql', group: 'Data Format Convert' },
  { title: 'SQL to CSV', description: 'Rows of INSERT statements to CSV', href: '/tools/developer-tools/sql-to-csv', group: 'Data Format Convert' },
  { title: '.env to JSON', description: '.env lines to JSON and back, dotenv rules', href: '/tools/developer-tools/env-to-json', group: 'Utilities' },
  { title: 'Code Minifier', description: 'Minify JavaScript, TypeScript, CSS or HTML', href: '/tools/developer-tools/code-minifier', group: 'Code Formatting' },
  { title: 'Diff Viewer', description: 'Line-by-line diff with changed words highlighted', href: '/tools/developer-tools/diff-viewer', group: 'Generators & Security' },
  { title: 'Code Formatter', description: 'Format code in 13 languages', href: '/tools/developer-tools/code-formatter', group: 'Code Formatting' },
  { title: 'Cron Expression', description: 'Check a 5-field cron expression and its next runs', href: '/tools/developer-tools/cron-expression', group: 'Utilities' },
  { title: 'Cron Expression Builder', description: 'Build a cron expression from 8 presets', href: '/tools/developer-tools/cron-expression-builder', group: 'Utilities' },
];

export default function DeveloperToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="developer-tools" className={`w-8 h-8 ${categoryColors['developer-tools']}`} /> Developer Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Data formats, code formatting, encoding and generators - {tools.length} tools</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Developer Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">These tools transform text you paste, or a file you open, on the page itself, with libraries such as SheetJS for Excel, Terser for JavaScript and Dart Sass for SCSS. The code and data you give them are not sent to our server. API Tester is the one tool that sends something: the request you write, from your browser to the address you type. The page covers data formats (JSON, XML, YAML, TOML, CSV, Excel), code formatting and minifying, encodings (Base64, URL, HTML, Unicode, hex), generators, and types from JSON for six languages.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Developer Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Find the tool by task: convert a data format, format or minify code, encode or decode, generate values, or inspect a token, URL or timestamp.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste your input or, where the tool offers it, open a file such as a CSV file or an Excel workbook.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Correct the input if the tool reports an error: the JSON, XML, YAML and TOML tools check that it parses before converting it.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the output or download it; Excel to CSV gives a ZIP with one CSV per sheet when the workbook has several.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the code or data I paste sent anywhere?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, with one exception: API Tester sends the request you write from your browser to the address you type, so that server receives it. The other tools work on the page; only an error message they display, cleaned, reaches our error log with the tool name and your browser's name and version.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why does API Tester fail on an API that works in Postman?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Because the request leaves your browser, which enforces CORS: if the API does not allow calls from other websites, the browser blocks the response. Postman and curl do not apply this rule.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which languages can I generate types for from JSON?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Six: TypeScript interfaces, Go structs, Rust structs for serde, Python dataclasses, PHP 8 classes and C# classes. Each tool reads a JSON sample, and most make one type per nested object.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Are the generated passwords and UUIDs random?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes. Password Generator and UUID Generator draw their random values from crypto.getRandomValues, the browser's cryptographic random source, not from Math.random. A version 7 UUID also contains its creation time.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Paste a JSON response from API Tester into JSON to TypeScript to get matching interfaces.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare two versions of a config file in Diff Viewer; changed words inside a line are highlighted.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Timestamp Converter guesses seconds, milliseconds, microseconds or nanoseconds from the number of digits.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Choose UUID version 7 when the IDs should sort by creation time, version 4 when they should reveal nothing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}