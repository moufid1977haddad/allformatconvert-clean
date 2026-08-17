// Shared tool catalog for the homepage drop-zone (app/page.jsx).
//
// ALL_TOOLS mirrors the navbar's own name/href list (app/components/Navbar.jsx
// `allTools`) so every suggestion links to a real, correctly-named tool page —
// Navbar.jsx itself is intentionally left untouched, so this is a separate,
// hand-synced copy rather than a shared import.
//
// FORMAT_MAP below is the actual "format -> tools" correspondence. It is built
// from the real `accept="..."` attribute on each tool page's file input (verified
// against the source on disk), not invented: every entry here is a tool whose own
// upload input genuinely accepts that file type. Where a format only has a couple
// of dedicated tools, the list is shorter than 5 rather than padded with tools
// that would actually reject the file — the 5-tool cap is a ceiling, never a floor
// enforced by fabricating matches.

export const ALL_TOOLS = [
  // PDF Tools
  { name: 'Merge PDF',            href: '/tools/pdf-tools/pdf-merge' },
  { name: 'Split PDF',            href: '/tools/pdf-tools/pdf-split' },
  { name: 'Compress PDF',         href: '/tools/pdf-tools/pdf-compress' },
  { name: 'PDF to Word',          href: '/tools/pdf-tools/pdf-to-word' },
  { name: 'PDF to Excel',         href: '/tools/pdf-tools/pdf-to-excel' },
  { name: 'PDF to JPG',           href: '/tools/pdf-tools/pdf-to-jpg' },
  { name: 'PDF to Image',         href: '/tools/pdf-tools/pdf-to-image' },
  { name: 'PDF to HTML',          href: '/tools/pdf-tools/pdf-to-html' },
  { name: 'PDF to PPT',           href: '/tools/pdf-tools/pdf-to-ppt' },
  { name: 'PDF to PDF/A',         href: '/tools/pdf-tools/pdf-to-pdfa' },
  { name: 'Word to PDF',          href: '/tools/pdf-tools/word-to-pdf' },
  { name: 'JPG to PDF',           href: '/tools/pdf-tools/jpg-to-pdf' },
  { name: 'Image to PDF',         href: '/tools/pdf-tools/image-to-pdf' },
  { name: 'Excel to PDF',         href: '/tools/pdf-tools/excel-to-pdf' },
  { name: 'PPT to PDF',           href: '/tools/pdf-tools/ppt-to-pdf' },
  { name: 'HTML to PDF',          href: '/tools/pdf-tools/html-to-pdf' },
  { name: 'EPUB to PDF',          href: '/tools/pdf-tools/epub-to-pdf' },
  { name: 'MOBI to PDF',          href: '/tools/pdf-tools/mobi-to-pdf' },
  { name: 'Markdown to PDF',      href: '/tools/pdf-tools/markdown-to-pdf' },
  { name: 'Text to PDF',          href: '/tools/pdf-tools/text-to-pdf' },
  { name: 'PDF Sign',             href: '/tools/pdf-tools/pdf-sign' },
  { name: 'PDF Editor',           href: '/tools/pdf-tools/pdf-editor' },
  { name: 'PDF OCR',              href: '/tools/pdf-tools/pdf-ocr' },
  { name: 'PDF Forms',            href: '/tools/pdf-tools/pdf-forms' },
  { name: 'PDF Protect',          href: '/tools/pdf-tools/pdf-protect' },
  { name: 'PDF Unlock',           href: '/tools/pdf-tools/pdf-unlock' },
  { name: 'PDF Watermark',        href: '/tools/pdf-tools/pdf-watermark' },
  { name: 'PDF Rotate',           href: '/tools/pdf-tools/pdf-rotate' },
  { name: 'PDF Crop',             href: '/tools/pdf-tools/pdf-crop' },
  { name: 'PDF Repair',           href: '/tools/pdf-tools/pdf-repair' },
  { name: 'PDF Compare',          href: '/tools/pdf-tools/pdf-compare' },
  { name: 'PDF Redact',           href: '/tools/pdf-tools/pdf-redact' },
  { name: 'PDF Translate',        href: '/tools/pdf-tools/pdf-translate' },
  { name: 'PDF Organize',         href: '/tools/pdf-tools/pdf-organize' },
  { name: 'PDF Reorder Pages',    href: '/tools/pdf-tools/pdf-reorder-pages' },
  { name: 'PDF Delete Pages',     href: '/tools/pdf-tools/pdf-delete-pages' },
  { name: 'PDF Number Pages',     href: '/tools/pdf-tools/pdf-number-pages' },
  { name: 'PDF Extract Text',     href: '/tools/pdf-tools/pdf-extract-text' },
  { name: 'PDF AI Summary',       href: '/tools/pdf-tools/pdf-ai-summary' },

  // Image Tools
  { name: 'Image Compressor',     href: '/tools/image-tools/image-compressor' },
  { name: 'Image Converter',      href: '/tools/image-tools/image-converter' },
  { name: 'Image Resizer',        href: '/tools/image-tools/image-resizer' },
  { name: 'Image Cropper',        href: '/tools/image-tools/image-cropper' },
  { name: 'Image Editor',         href: '/tools/image-tools/image-editor' },
  { name: 'Image Flip',           href: '/tools/image-tools/image-flip' },
  { name: 'Image Rotate',         href: '/tools/image-tools/image-rotate' },
  { name: 'Image Blur',           href: '/tools/image-tools/image-blur' },
  { name: 'Image Inverter',       href: '/tools/image-tools/image-inverter' },
  { name: 'Image Pixelator',      href: '/tools/image-tools/image-pixelator' },
  { name: 'Image Comparison',     href: '/tools/image-tools/image-comparison' },
  { name: 'Image Metadata',       href: '/tools/image-tools/image-metadata' },
  { name: 'Image to Base64',      href: '/tools/image-tools/image-to-base64' },
  { name: 'Add Border to Image',  href: '/tools/image-tools/add-border-to-image' },
  { name: 'Add Text to Image',    href: '/tools/image-tools/add-text-to-image' },
  { name: 'Add Noise',            href: '/tools/image-tools/add-noise' },
  { name: 'Add Vignette',         href: '/tools/image-tools/add-vignette' },
  { name: 'Brightness Contrast',  href: '/tools/image-tools/brightness-contrast' },
  { name: 'Grayscale Converter',  href: '/tools/image-tools/grayscale-converter' },
  { name: 'Sepia Filter',         href: '/tools/image-tools/sepia-filter' },
  { name: 'Round Corners',        href: '/tools/image-tools/round-corners' },
  { name: 'Duplicate Image Finder', href: '/tools/image-tools/duplicate-image-finder' },
  { name: 'JPG to PNG',           href: '/tools/image-tools/jpg-to-png' },
  { name: 'JPG to WebP',          href: '/tools/image-tools/jpg-to-webp' },
  { name: 'PNG to JPG',           href: '/tools/image-tools/png-to-jpg' },
  { name: 'PNG to WebP',          href: '/tools/image-tools/png-to-webp' },
  { name: 'PNG to ICO',           href: '/tools/image-tools/png-to-ico' },
  { name: 'WebP to JPG',          href: '/tools/image-tools/webp-to-jpg' },
  { name: 'WebP to PNG',          href: '/tools/image-tools/webp-to-png' },
  { name: 'BMP to PNG',           href: '/tools/image-tools/bmp-to-png' },
  { name: 'SVG to PNG',           href: '/tools/image-tools/svg-to-png' },
  { name: 'HEIC to JPG',          href: '/tools/image-tools/heic-to-jpg' },
  { name: 'HEIC to PNG',          href: '/tools/image-tools/heic-to-png' },
  { name: 'ICO to PNG',           href: '/tools/image-tools/ico-to-png' },
  { name: 'TIFF to JPG',          href: '/tools/image-tools/tiff-to-jpg' },
  { name: 'TIFF to PNG',          href: '/tools/image-tools/tiff-to-png' },
  { name: 'GIF to PNG',           href: '/tools/image-tools/gif-to-png' },

  // GIF Tools
  { name: 'APNG to GIF',          href: '/tools/gif-tools/apng-to-gif' },
  { name: 'AVI to GIF',           href: '/tools/gif-tools/avi-to-gif' },
  { name: 'GIF to APNG',          href: '/tools/gif-tools/gif-to-apng' },
  { name: 'GIF to MP4',           href: '/tools/gif-tools/gif-to-mp4' },
  { name: 'Image to GIF',         href: '/tools/gif-tools/image-to-gif' },
  { name: 'MOV to GIF',           href: '/tools/gif-tools/mov-to-gif' },
  { name: 'MP4 to GIF',           href: '/tools/gif-tools/mp4-to-gif' },
  { name: 'Video to GIF',         href: '/tools/gif-tools/video-to-gif' },
  { name: 'WebM to GIF',          href: '/tools/gif-tools/webm-to-gif' },
  { name: 'GIF Maker',            href: '/tools/gif-tools/gif-maker' },
  { name: 'GIF Compressor',       href: '/tools/gif-tools/gif-compressor' },

  // Audio Tools
  { name: 'Audio Converter',      href: '/tools/audio-tools/audio-converter' },
  { name: 'Audio Compressor',     href: '/tools/audio-tools/audio-compressor' },
  { name: 'Audio Trimmer',        href: '/tools/audio-tools/audio-trimmer' },
  { name: 'Audio Merger',         href: '/tools/audio-tools/audio-merger' },
  { name: 'Audio Splitter',       href: '/tools/audio-tools/audio-splitter' },
  { name: 'Audio Booster',        href: '/tools/audio-tools/audio-booster' },
  { name: 'Audio Equalizer',      href: '/tools/audio-tools/audio-equalizer' },
  { name: 'Audio Metadata',       href: '/tools/audio-tools/audio-metadata' },
  { name: 'Audio Waveform',       href: '/tools/audio-tools/audio-waveform' },
  { name: 'Audio to Text',        href: '/tools/audio-tools/audio-to-text' },
  { name: 'Voice Recorder',       href: '/tools/audio-tools/voice-recorder' },

  // Video Tools
  { name: 'Video Converter',      href: '/tools/video-tools/video-converter' },
  { name: 'Video Compressor',     href: '/tools/video-tools/video-compressor' },
  { name: 'Video Trimmer',        href: '/tools/video-tools/video-trimmer' },
  { name: 'Video Merger',         href: '/tools/video-tools/video-merger' },
  { name: 'Video Resizer',        href: '/tools/video-tools/video-resizer' },
  { name: 'Video Rotator',        href: '/tools/video-tools/video-rotator' },
  { name: 'Video Filter',         href: '/tools/video-tools/video-filter' },
  { name: 'Video Watermark',      href: '/tools/video-tools/video-watermark' },
  { name: 'Video Metadata',       href: '/tools/video-tools/video-metadata' },
  { name: 'Video Screenshot',     href: '/tools/video-tools/video-screenshot' },
  { name: 'Video to Audio',       href: '/tools/video-tools/video-to-audio' },
  { name: 'Media Player',         href: '/tools/video-tools/media-player' },
  { name: 'Screen Recorder',      href: '/tools/video-tools/screen-recorder' },
  { name: 'Subtitle Generator',   href: '/tools/video-tools/subtitle-generator' },

  // Text Tools
  { name: 'Word Counter',         href: '/tools/text-tools/word-counter' },
  { name: 'Character Counter',    href: '/tools/text-tools/character-counter' },
  { name: 'Case Converter',       href: '/tools/text-tools/case-converter' },
  { name: 'Text Reverser',        href: '/tools/text-tools/text-reverser' },
  { name: 'Text Sorter',          href: '/tools/text-tools/text-sorter' },
  { name: 'Text Comparator',      href: '/tools/text-tools/text-comparator' },
  { name: 'Text Repeater',        href: '/tools/text-tools/text-repeater' },
  { name: 'Text Truncator',       href: '/tools/text-tools/text-truncator' },
  { name: 'Text Encryptor',       href: '/tools/text-tools/text-encryptor' },
  { name: 'Text to List',         href: '/tools/text-tools/text-to-list' },
  { name: 'Find and Replace',     href: '/tools/text-tools/find-replace' },
  { name: 'Duplicate Remover',    href: '/tools/text-tools/duplicate-remover' },
  { name: 'Whitespace Remover',   href: '/tools/text-tools/whitespace-remover' },
  { name: 'Lorem Ipsum',          href: '/tools/text-tools/lorem-ipsum' },
  { name: 'ASCII Art',            href: '/tools/text-tools/ascii-art' },
  { name: 'Sticky Notes',         href: '/tools/text-tools/sticky-notes' },
  { name: 'URL Encoder Text',     href: '/tools/text-tools/url-encoder' },

  // File Tools
  { name: 'ZIP Creator',          href: '/tools/file-tools/zip-creator' },
  { name: 'ZIP Extractor',        href: '/tools/file-tools/zip-extractor' },
  { name: 'TAR Extractor',        href: '/tools/file-tools/tar-extractor' },
  { name: 'File Converter',       href: '/tools/file-tools/file-converter' },
  { name: 'File Comparator',      href: '/tools/file-tools/file-comparator' },
  { name: 'File Encryptor',       href: '/tools/file-tools/file-encryptor' },
  { name: 'File Metadata',        href: '/tools/file-tools/file-metadata' },
  { name: 'File Splitter',        href: '/tools/file-tools/file-splitter' },
  { name: 'Base64 Encoder File',  href: '/tools/file-tools/base64-encoder' },

  // AI Tools
  { name: 'AI Chatbot',           href: '/tools/ai-tools/ai-chatbot' },
  { name: 'AI Translator',        href: '/tools/ai-tools/ai-translator' },
  { name: 'AI Writer',            href: '/tools/ai-tools/ai-writer' },
  { name: 'AI Detector',          href: '/tools/ai-tools/ai-detector' },
  { name: 'AI Paraphraser',       href: '/tools/ai-tools/ai-paraphraser' },
  { name: 'Grammar Fixer',        href: '/tools/ai-tools/grammar-fixer' },
  { name: 'Text Summarizer',      href: '/tools/ai-tools/text-summarizer' },
  { name: 'Background Remover',   href: '/tools/ai-tools/background-remover' },
  { name: 'Image Upscaler',       href: '/tools/ai-tools/image-upscaler' },
  { name: 'Image Generator',      href: '/tools/ai-tools/image-generator' },
  { name: 'Image Captioner',      href: '/tools/ai-tools/image-captioner' },
  { name: 'Audio Transcriber',    href: '/tools/ai-tools/audio-transcriber' },
  { name: 'Email Generator',      href: '/tools/ai-tools/email-generator' },
  { name: 'Keyword Extractor',    href: '/tools/ai-tools/keyword-extractor' },
  { name: 'Sentiment Analyzer',   href: '/tools/ai-tools/sentiment-analyzer' },
  { name: 'Data Extractor',       href: '/tools/ai-tools/data-extractor' },

  // Developer Tools
  { name: 'JSON Formatter',       href: '/tools/developer-tools/json-formatter' },
  { name: 'JSON Minifier',        href: '/tools/developer-tools/json-minifier' },
  { name: 'JSON to CSV',          href: '/tools/developer-tools/json-to-csv' },
  { name: 'JSON to XML',          href: '/tools/developer-tools/json-to-xml' },
  { name: 'JSON to YAML',         href: '/tools/developer-tools/json-to-yaml' },
  { name: 'JSON to TOML',         href: '/tools/developer-tools/json-to-toml' },
  { name: 'JSON to TypeScript',   href: '/tools/developer-tools/json-to-typescript' },
  { name: 'JSON to Python',       href: '/tools/developer-tools/json-to-python' },
  { name: 'JSON to Go',           href: '/tools/developer-tools/json-to-go' },
  { name: 'JSON to PHP',          href: '/tools/developer-tools/json-to-php' },
  { name: 'JSON to C#',           href: '/tools/developer-tools/json-to-csharp' },
  { name: 'JSON to Rust',         href: '/tools/developer-tools/json-to-rust' },
  { name: 'XML Formatter',        href: '/tools/developer-tools/xml-formatter' },
  { name: 'XML to JSON',          href: '/tools/developer-tools/xml-to-json' },
  { name: 'YAML to JSON',         href: '/tools/developer-tools/yaml-to-json' },
  { name: 'TOML to JSON',         href: '/tools/developer-tools/toml-to-json' },
  { name: 'CSV to JSON',          href: '/tools/developer-tools/csv-to-json' },
  { name: 'CSV to Excel',         href: '/tools/developer-tools/csv-to-excel' },
  { name: 'CSV to SQL',           href: '/tools/developer-tools/csv-to-sql' },
  { name: 'CSV to TSV',           href: '/tools/developer-tools/csv-to-tsv' },
  { name: 'Excel to CSV',         href: '/tools/developer-tools/excel-to-csv' },
  { name: 'Excel to JSON',        href: '/tools/developer-tools/excel-to-json' },
  { name: 'SQL to CSV',           href: '/tools/developer-tools/sql-to-csv' },
  { name: 'TSV to CSV',           href: '/tools/developer-tools/tsv-to-csv' },
  { name: 'Base64 Encoder',       href: '/tools/developer-tools/base64-encoder' },
  { name: 'URL Encoder',          href: '/tools/developer-tools/url-encoder' },
  { name: 'URL Parser',           href: '/tools/developer-tools/url-parser' },
  { name: 'HTML Formatter',       href: '/tools/developer-tools/html-formatter' },
  { name: 'HTML Encoder',         href: '/tools/developer-tools/html-encoder' },
  { name: 'HTML Entity Decoder',  href: '/tools/developer-tools/html-entity-decoder' },
  { name: 'CSS Formatter',        href: '/tools/developer-tools/css-formatter' },
  { name: 'SCSS to CSS',          href: '/tools/developer-tools/scss-to-css' },
  { name: 'JavaScript Formatter', href: '/tools/developer-tools/javascript-formatter' },
  { name: 'JS Minifier',          href: '/tools/developer-tools/js-minifier' },
  { name: 'TypeScript to JS',     href: '/tools/developer-tools/typescript-to-js' },
  { name: 'SQL Formatter',        href: '/tools/developer-tools/sql-formatter' },
  { name: 'Markdown Editor',      href: '/tools/developer-tools/markdown-editor' },
  { name: 'Markdown Previewer',   href: '/tools/developer-tools/markdown-previewer' },
  { name: 'Markdown to HTML',     href: '/tools/developer-tools/markdown-to-html' },
  { name: 'Hash Generator',       href: '/tools/developer-tools/hash-generator' },
  { name: 'UUID Generator',       href: '/tools/developer-tools/uuid-generator' },
  { name: 'Password Generator',   href: '/tools/developer-tools/password-generator' },
  { name: 'JWT Decoder',          href: '/tools/developer-tools/jwt-decoder' },
  { name: 'Regex Tester',         href: '/tools/developer-tools/regex-tester' },
  { name: 'Diff Viewer',          href: '/tools/developer-tools/diff-viewer' },
  { name: 'Code Formatter',       href: '/tools/developer-tools/code-formatter' },
  { name: 'Code Minifier',        href: '/tools/developer-tools/code-minifier' },
  { name: 'Color Picker',         href: '/tools/developer-tools/color-picker' },
  { name: 'Aspect Ratio',         href: '/tools/developer-tools/aspect-ratio' },
  { name: 'Timestamp Converter',  href: '/tools/developer-tools/timestamp-converter' },
  { name: 'Cron Expression',      href: '/tools/developer-tools/cron-expression' },
  { name: 'Cron Builder',         href: '/tools/developer-tools/cron-expression-builder' },
  { name: 'Hex to Text',          href: '/tools/developer-tools/hex-to-text' },
  { name: 'Unicode Converter',    href: '/tools/developer-tools/unicode-converter' },
  { name: 'Number Base Converter',href: '/tools/developer-tools/number-base-converter' },
  { name: 'ENV to JSON',          href: '/tools/developer-tools/env-to-json' },
  { name: 'API Tester',           href: '/tools/developer-tools/api-tester' },

  // Converter Tools
  { name: 'Color Converter',      href: '/tools/converter-tools/color-converter' },
  { name: 'Currency Converter',   href: '/tools/converter-tools/currency-converter' },
  { name: 'Unit Converter',       href: '/tools/converter-tools/unit-converter' },
  { name: 'MOBI to EPUB',         href: '/tools/converter-tools/mobi-to-epub' },

  // Math Tools
  { name: 'Scientific Calculator',   href: '/tools/math-tools/scientific-calculator' },
  { name: 'Percentage Calculator',   href: '/tools/math-tools/percentage-calculator' },
  { name: 'Fraction Calculator',     href: '/tools/math-tools/fraction-calculator' },
  { name: 'Statistics Calculator',   href: '/tools/math-tools/statistics-calculator' },
  { name: 'Roman Numeral Converter', href: '/tools/math-tools/roman-numeral-converter' },
  { name: 'Number Base Converter',   href: '/tools/math-tools/number-base-converter' },

  // QR & Barcodes
  { name: 'QR Generator',         href: '/tools/qr-barcodes-tools/qr-generator' },
  { name: 'QR Scanner',           href: '/tools/qr-barcodes-tools/qr-scanner' },
  { name: 'Barcode Generator',    href: '/tools/qr-barcodes-tools/barcode-generator' },
];

const TOOLS_BY_HREF = new Map(ALL_TOOLS.map(t => [t.href, t.name]));

export function nameFor(href) {
  return TOOLS_BY_HREF.get(href) || href;
}

// Category short label + static fallback count (mirrors app/page.jsx's own
// `categories` list — used only if the live /api/tool-counts fetch hasn't
// resolved yet).
export const CATEGORY_META = {
  'pdf-tools':   { label: 'PDF',   href: '/tools/pdf-tools',   count: 39 },
  'image-tools': { label: 'Image', href: '/tools/image-tools', count: 37 },
  'gif-tools':   { label: 'GIF',   href: '/tools/gif-tools',   count: 11 },
  'audio-tools': { label: 'Audio', href: '/tools/audio-tools', count: 11 },
  'video-tools': { label: 'Video', href: '/tools/video-tools', count: 15 },
  'file-tools':  { label: 'File',  href: '/tools/file-tools',  count: 9  },
};

// Tools that place no restriction on the file's type at all (no `accept`
// attribute on their upload input) -- genuinely usable on any format, so
// they're a safe way to still offer a real, working suggestion for formats
// that don't have 5 dedicated matches, without pretending a converter
// accepts a file it would actually reject.
const UNIVERSAL = [
  { href: '/tools/file-tools/file-metadata',  note: 'View technical details about the file' },
  { href: '/tools/file-tools/file-encryptor', note: 'Password-protect the file' },
];

function img(...extra) {
  return [
    ...extra,
    { href: '/tools/image-tools/image-compressor', note: 'Reduce file size, keep the quality' },
    { href: '/tools/image-tools/image-converter',  note: 'Convert to PNG, JPG, WebP, and more' },
    { href: '/tools/image-tools/image-resizer',    note: 'Resize to exact dimensions' },
  ].slice(0, 5);
}

function video(fifth) {
  return [
    { href: '/tools/video-tools/video-converter', note: 'Convert to another video format' },
    { href: '/tools/video-tools/video-compressor', note: 'Reduce file size, keep the quality' },
    { href: '/tools/video-tools/video-trimmer',    note: 'Cut a clip from the video' },
    { href: '/tools/video-tools/video-to-audio',   note: 'Extract just the audio track' },
    fifth,
  ];
}

const AUDIO_SET = [
  { href: '/tools/audio-tools/audio-converter', note: 'Convert to MP3, WAV, and more' },
  { href: '/tools/audio-tools/audio-compressor', note: 'Reduce file size, keep the quality' },
  { href: '/tools/audio-tools/audio-trimmer',    note: 'Cut a clip from the track' },
  { href: '/tools/ai-tools/audio-transcriber',   note: 'Turn the speech into text with AI' },
  { href: '/tools/audio-tools/audio-to-text',    note: 'Transcribe the audio' },
];

// format -> { category slug, tools: [{href, note}] }, at most 5 entries, every
// href backed by a tool whose own file input really accepts that format.
export const FORMAT_MAP = {
  pdf: { category: 'pdf-tools', tools: [
    { href: '/tools/pdf-tools/pdf-compress', note: 'Shrink the file size without losing quality' },
    { href: '/tools/pdf-tools/pdf-merge',    note: 'Combine it with other PDFs into one file' },
    { href: '/tools/pdf-tools/pdf-split',    note: 'Pull specific pages into a new file' },
    { href: '/tools/pdf-tools/pdf-to-word',  note: 'Turn it into an editable Word document' },
    { href: '/tools/pdf-tools/pdf-to-jpg',   note: 'Export each page as a JPG image' },
  ]},

  jpg: { category: 'image-tools', tools: img(
    { href: '/tools/image-tools/jpg-to-png',        note: 'Convert to PNG (with transparency)' },
    { href: '/tools/ai-tools/background-remover',   note: 'Remove the background with AI' },
  )},
  png: { category: 'image-tools', tools: img(
    { href: '/tools/image-tools/png-to-jpg',  note: 'Convert to JPG' },
    { href: '/tools/image-tools/png-to-ico',  note: 'Turn it into a favicon/icon file' },
  )},
  webp: { category: 'image-tools', tools: img(
    { href: '/tools/image-tools/webp-to-jpg', note: 'Convert to JPG' },
    { href: '/tools/image-tools/webp-to-png', note: 'Convert to PNG' },
  )},
  svg: { category: 'image-tools', tools: img(
    { href: '/tools/image-tools/svg-to-png',  note: 'Rasterize it to a PNG' },
  )},
  bmp: { category: 'image-tools', tools: img(
    { href: '/tools/image-tools/bmp-to-png',  note: 'Convert to PNG' },
  )},
  tiff: { category: 'image-tools', tools: img(
    { href: '/tools/image-tools/tiff-to-jpg', note: 'Convert to JPG' },
    { href: '/tools/image-tools/tiff-to-png', note: 'Convert to PNG' },
  )},
  heic: { category: 'image-tools', tools: img(
    { href: '/tools/image-tools/heic-to-jpg', note: 'Convert to JPG' },
    { href: '/tools/image-tools/heic-to-png', note: 'Convert to PNG' },
  )},
  ico: { category: 'image-tools', tools: img(
    { href: '/tools/image-tools/ico-to-png',  note: 'Convert to PNG' },
  )},

  gif: { category: 'gif-tools', tools: [
    { href: '/tools/gif-tools/gif-compressor',  note: 'Shrink the file size' },
    { href: '/tools/gif-tools/gif-to-mp4',      note: 'Convert it into an MP4 video' },
    { href: '/tools/gif-tools/gif-to-apng',     note: 'Convert to an animated PNG' },
    { href: '/tools/image-tools/gif-to-png',    note: 'Extract a still PNG frame' },
  ]},

  mp3:  { category: 'audio-tools', tools: AUDIO_SET },
  wav:  { category: 'audio-tools', tools: AUDIO_SET },
  ogg:  { category: 'audio-tools', tools: AUDIO_SET },
  m4a:  { category: 'audio-tools', tools: AUDIO_SET },
  flac: { category: 'audio-tools', tools: AUDIO_SET },
  aac:  { category: 'audio-tools', tools: AUDIO_SET },

  mp4:  { category: 'video-tools', tools: video({ href: '/tools/gif-tools/mp4-to-gif', note: 'Turn it into an animated GIF' }) },
  mov:  { category: 'video-tools', tools: video({ href: '/tools/gif-tools/mov-to-gif', note: 'Turn it into an animated GIF' }) },
  avi:  { category: 'video-tools', tools: video({ href: '/tools/gif-tools/avi-to-gif', note: 'Turn it into an animated GIF' }) },
  webm: { category: 'video-tools', tools: video({ href: '/tools/gif-tools/webm-to-gif', note: 'Turn it into an animated GIF' }) },
  mkv:  { category: 'video-tools', tools: video({ href: '/tools/gif-tools/video-to-gif', note: 'Turn it into an animated GIF' }) },
  mpeg: { category: 'video-tools', tools: video({ href: '/tools/gif-tools/video-to-gif', note: 'Turn it into an animated GIF' }) },

  docx: { category: 'file-tools', tools: [
    { href: '/tools/pdf-tools/word-to-pdf', note: 'Convert it to a PDF document' },
    ...UNIVERSAL,
  ]},
  xlsx: { category: 'file-tools', tools: [
    { href: '/tools/pdf-tools/excel-to-pdf',        note: 'Convert it to a PDF document' },
    { href: '/tools/developer-tools/excel-to-csv',  note: 'Convert to CSV' },
    { href: '/tools/developer-tools/excel-to-json', note: 'Convert to JSON' },
    ...UNIVERSAL,
  ]},
  pptx: { category: 'file-tools', tools: [
    { href: '/tools/pdf-tools/ppt-to-pdf', note: 'Convert it to a PDF document' },
    ...UNIVERSAL,
  ]},
  txt: { category: 'file-tools', tools: [
    { href: '/tools/pdf-tools/text-to-pdf',       note: 'Convert it to a PDF document' },
    { href: '/tools/pdf-tools/markdown-to-pdf',   note: 'Convert it to a PDF document' },
    { href: '/tools/file-tools/file-converter',   note: 'Convert to CSV, JSON, HTML, or Markdown' },
    ...UNIVERSAL,
  ]},
  csv: { category: 'file-tools', tools: [
    { href: '/tools/developer-tools/csv-to-excel',  note: 'Convert to an Excel spreadsheet' },
    { href: '/tools/developer-tools/excel-to-json', note: 'Convert to JSON' },
    { href: '/tools/file-tools/file-converter',     note: 'Convert to TXT, JSON, HTML, or Markdown' },
    ...UNIVERSAL,
  ]},
  json: { category: 'file-tools', tools: [
    { href: '/tools/file-tools/file-converter', note: 'Convert to TXT, CSV, HTML, or Markdown' },
    ...UNIVERSAL,
  ]},
  zip: { category: 'file-tools', tools: [
    { href: '/tools/file-tools/zip-extractor', note: 'Unpack the archive' },
    ...UNIVERSAL,
  ]},
  tar: { category: 'file-tools', tools: [
    { href: '/tools/file-tools/tar-extractor', note: 'Unpack the archive' },
    ...UNIVERSAL,
  ]},
  epub: { category: 'file-tools', tools: [
    { href: '/tools/pdf-tools/epub-to-pdf', note: 'Convert it to a PDF document' },
    ...UNIVERSAL,
  ]},
  mobi: { category: 'file-tools', tools: [
    { href: '/tools/pdf-tools/mobi-to-pdf',            note: 'Convert it to a PDF document' },
    { href: '/tools/converter-tools/mobi-to-epub',     note: 'Convert it to an EPUB ebook' },
    ...UNIVERSAL,
  ]},
};

const EXT_ALIASES = {
  jpeg: 'jpg',
  tif: 'tiff',
  heif: 'heic',
  mpg: 'mpeg',
  doc: 'docx',
  xls: 'xlsx',
  ppt: 'pptx',
};

export function normalizeExt(ext) {
  const e = (ext || '').toLowerCase().replace(/^\./, '');
  return EXT_ALIASES[e] || e;
}

export function detectFormat(filename) {
  const m = /\.([a-z0-9]+)$/i.exec(filename || '');
  return m ? normalizeExt(m[1]) : null;
}

export function getSuggestions(filename) {
  const ext = detectFormat(filename);
  if (!ext) return null;
  const entry = FORMAT_MAP[ext];
  if (!entry) return null;
  const meta = CATEGORY_META[entry.category];
  return {
    ext,
    category: entry.category,
    categoryLabel: meta.label,
    categoryHref: meta.href,
    fallbackCount: meta.count,
    tools: entry.tools.slice(0, 5).map(t => ({ ...t, name: nameFor(t.href) })),
  };
}
