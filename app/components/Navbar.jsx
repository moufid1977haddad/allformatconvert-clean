'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import { ToolIcon, toolBgColors, categoryColors } from '@/app/lib/toolIcons';
import {
  Search, FileText, Image as ImageIcon, Film, Headphones, Video, Type, Folder,
  QrCode, Repeat, Code, Calculator, Bot, Menu, X,
} from 'lucide-react';

const poppinsMedium = Poppins({ weight: '500', subsets: ['latin'] });

const categories = [
  { href: '/tools/pdf-tools', label: 'PDF', icon: FileText },
  { href: '/tools/image-tools', label: 'Image', icon: ImageIcon },
  { href: '/tools/gif-tools', label: 'GIF', icon: Film },
  { href: '/tools/audio-tools', label: 'Audio', icon: Headphones },
  { href: '/tools/video-tools', label: 'Video', icon: Video },
  { href: '/tools/text-tools', label: 'Text', icon: Type },
  { href: '/tools/file-tools', label: 'File', icon: Folder },
  { href: '/tools/qr-barcodes-tools', label: 'QR', icon: QrCode },
  { href: '/tools/converter-tools', label: 'Convert', icon: Repeat },
  { href: '/tools/developer-tools', label: 'Dev', icon: Code },
  { href: '/tools/math-tools', label: 'Math', icon: Calculator },
  { href: '/tools/ai-tools', label: 'AI', icon: Bot },
];

// Maps a category's group count to a literal xl:grid-cols-N class so Tailwind's
// static scanner can find it (dynamic template strings would be invisible to it).
// 7 (PDF Tools only, the sole 7-group category) uses a later custom breakpoint
// instead of xl(1280px): at 1280-1431px the panel's w-[1400px] is clamped by
// max-w-[calc(100vw-32px)] down to as little as 1248px, which squeezes 7 equal
// columns to ~160px and wraps "Convert from PDF" onto 2 lines, misaligning that
// column's items against its neighbors. 1440px is the first round breakpoint
// past 1432px, where 100vw-32px >= 1400px so the panel reaches its full,
// unclamped width and every column gets a comfortable ~181px.
const xlGridColsByGroupCount = {
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
  7: 'min-[1440px]:grid-cols-7',
};

// Matching width breakpoint for the 7-group case, see above -- keeps the panel
// at the same 820px/4-column layout already verified clean at 1024-1439px,
// instead of widening to 1400px at xl(1280px) while columns are still 4.
const widthByGroupCount = {
  7: 'min-[1440px]:w-[1400px]',
};

// Flat categories with enough tools (11) that a 2-column layout reads faster
// than a single tall column.
const flatTwoColumnCategories = new Set(['/tools/gif-tools', '/tools/audio-tools']);

// Flat categories whose trigger sits close enough to the right edge of the
// nav that a start-anchored dropdown overflows the viewport at narrower
// desktop widths (~1024px) -- anchor these from the end instead.
const flatEndAnchoredCategories = new Set(['/tools/converter-tools', '/tools/math-tools']);

const categoryTools = {
  '/tools/pdf-tools': [
    { group: 'Organize', items: [
      { name: 'Merge PDF', href: '/tools/pdf-tools/pdf-merge' },
      { name: 'Split PDF', href: '/tools/pdf-tools/pdf-split' },
      { name: 'Delete Pages', href: '/tools/pdf-tools/pdf-delete-pages' },
      { name: 'Reorder Pages', href: '/tools/pdf-tools/pdf-reorder-pages' },
      { name: 'Organize PDF', href: '/tools/pdf-tools/pdf-organize' },
    ]},
    { group: 'Optimize', items: [
      { name: 'Compress PDF', href: '/tools/pdf-tools/pdf-compress' },
      { name: 'Repair PDF', href: '/tools/pdf-tools/pdf-repair' },
      { name: 'PDF OCR', href: '/tools/pdf-tools/pdf-ocr' },
      { name: 'Extract Text', href: '/tools/pdf-tools/pdf-extract-text' },
    ]},
    { group: 'Convert to PDF', items: [
      { name: 'Image to PDF', href: '/tools/pdf-tools/image-to-pdf' },
      { name: 'JPG to PDF', href: '/tools/pdf-tools/jpg-to-pdf' },
      { name: 'Word to PDF', href: '/tools/pdf-tools/word-to-pdf' },
      { name: 'Excel to PDF', href: '/tools/pdf-tools/excel-to-pdf' },
      { name: 'PPT to PDF', href: '/tools/pdf-tools/ppt-to-pdf' },
      { name: 'HTML to PDF', href: '/tools/pdf-tools/html-to-pdf' },
      { name: 'Text to PDF', href: '/tools/pdf-tools/text-to-pdf' },
      { name: 'Markdown to PDF', href: '/tools/pdf-tools/markdown-to-pdf' },
      { name: 'EPUB to PDF', href: '/tools/pdf-tools/epub-to-pdf' },
      { name: 'MOBI to PDF', href: '/tools/pdf-tools/mobi-to-pdf' },
    ]},
    { group: 'Convert from PDF', items: [
      { name: 'PDF to Image', href: '/tools/pdf-tools/pdf-to-image' },
      { name: 'PDF to JPG', href: '/tools/pdf-tools/pdf-to-jpg' },
      { name: 'PDF to Word', href: '/tools/pdf-tools/pdf-to-word' },
      { name: 'PDF to Excel', href: '/tools/pdf-tools/pdf-to-excel' },
      { name: 'PDF to PPT', href: '/tools/pdf-tools/pdf-to-ppt' },
      { name: 'PDF to HTML', href: '/tools/pdf-tools/pdf-to-html' },
      { name: 'PDF to PDF/A', href: '/tools/pdf-tools/pdf-to-pdfa' },
    ]},
    { group: 'Edit', items: [
      { name: 'Rotate PDF', href: '/tools/pdf-tools/pdf-rotate' },
      { name: 'Watermark PDF', href: '/tools/pdf-tools/pdf-watermark' },
      { name: 'Number Pages', href: '/tools/pdf-tools/pdf-number-pages' },
      { name: 'PDF Editor', href: '/tools/pdf-tools/pdf-editor' },
      { name: 'PDF Forms', href: '/tools/pdf-tools/pdf-forms' },
      { name: 'Crop PDF', href: '/tools/pdf-tools/pdf-crop' },
    ]},
    { group: 'Security', items: [
      { name: 'Protect PDF', href: '/tools/pdf-tools/pdf-protect' },
      { name: 'Unlock PDF', href: '/tools/pdf-tools/pdf-unlock' },
      { name: 'Sign PDF', href: '/tools/pdf-tools/pdf-sign' },
      { name: 'Redact PDF', href: '/tools/pdf-tools/pdf-redact' },
      { name: 'Compare PDF', href: '/tools/pdf-tools/pdf-compare' },
    ]},
    { group: 'AI & Content', items: [
      { name: 'AI PDF Summary', href: '/tools/pdf-tools/pdf-ai-summary' },
      { name: 'Translate PDF', href: '/tools/pdf-tools/pdf-translate' },
    ]},
  ],
  '/tools/image-tools': [
    { group: 'Transform', items: [
      { name: 'Image Compressor', href: '/tools/image-tools/image-compressor' },
      { name: 'Image Converter', href: '/tools/image-tools/image-converter' },
      { name: 'Image Resizer', href: '/tools/image-tools/image-resizer' },
      { name: 'Image Cropper', href: '/tools/image-tools/image-cropper' },
      { name: 'Image Rotate', href: '/tools/image-tools/image-rotate' },
      { name: 'Image Flip', href: '/tools/image-tools/image-flip' },
    ]},
    { group: 'Annotate', items: [
      { name: 'Image Editor', href: '/tools/image-tools/image-editor' },
      { name: 'Add Text to Image', href: '/tools/image-tools/add-text-to-image' },
      { name: 'Add Border', href: '/tools/image-tools/add-border-to-image' },
      { name: 'Add Noise', href: '/tools/image-tools/add-noise' },
      { name: 'Add Vignette', href: '/tools/image-tools/add-vignette' },
      { name: 'Round Corners', href: '/tools/image-tools/round-corners' },
    ]},
    { group: 'Filters & Effects', items: [
      { name: 'Brightness & Contrast', href: '/tools/image-tools/brightness-contrast' },
      { name: 'Grayscale Converter', href: '/tools/image-tools/grayscale-converter' },
      { name: 'Image Blur', href: '/tools/image-tools/image-blur' },
      { name: 'Image Inverter', href: '/tools/image-tools/image-inverter' },
      { name: 'Sepia Filter', href: '/tools/image-tools/sepia-filter' },
      { name: 'Image Pixelator', href: '/tools/image-tools/image-pixelator' },
    ]},
    { group: 'Convert Format', items: [
      { name: 'HEIC to JPG', href: '/tools/image-tools/heic-to-jpg' },
      { name: 'HEIC to PNG', href: '/tools/image-tools/heic-to-png' },
      { name: 'WebP to PNG', href: '/tools/image-tools/webp-to-png' },
      { name: 'WebP to JPG', href: '/tools/image-tools/webp-to-jpg' },
      { name: 'PNG to JPG', href: '/tools/image-tools/png-to-jpg' },
      { name: 'JPG to PNG', href: '/tools/image-tools/jpg-to-png' },
      { name: 'SVG to PNG', href: '/tools/image-tools/svg-to-png' },
      { name: 'PNG to ICO', href: '/tools/image-tools/png-to-ico' },
      { name: 'JPG to WebP', href: '/tools/image-tools/jpg-to-webp' },
      { name: 'PNG to WebP', href: '/tools/image-tools/png-to-webp' },
      { name: 'BMP to PNG', href: '/tools/image-tools/bmp-to-png' },
      { name: 'TIFF to JPG', href: '/tools/image-tools/tiff-to-jpg' },
      { name: 'TIFF to PNG', href: '/tools/image-tools/tiff-to-png' },
      { name: 'ICO to PNG', href: '/tools/image-tools/ico-to-png' },
      { name: 'GIF to PNG', href: '/tools/image-tools/gif-to-png' },
    ]},
    { group: 'Analyze & Utilities', items: [
      { name: 'Image Metadata', href: '/tools/image-tools/image-metadata' },
      { name: 'Image to Base64', href: '/tools/image-tools/image-to-base64' },
      { name: 'Duplicate Finder', href: '/tools/image-tools/duplicate-image-finder' },
      { name: 'Image Comparison', href: '/tools/image-tools/image-comparison' },
    ]},
  ],
  '/tools/gif-tools': [
    { name: 'MP4 to GIF', href: '/tools/gif-tools/mp4-to-gif' },
    { name: 'Video to GIF', href: '/tools/gif-tools/video-to-gif' },
    { name: 'WEBM to GIF', href: '/tools/gif-tools/webm-to-gif' },
    { name: 'AVI to GIF', href: '/tools/gif-tools/avi-to-gif' },
    { name: 'MOV to GIF', href: '/tools/gif-tools/mov-to-gif' },
    { name: 'APNG to GIF', href: '/tools/gif-tools/apng-to-gif' },
    { name: 'GIF to MP4', href: '/tools/gif-tools/gif-to-mp4' },
    { name: 'GIF to APNG', href: '/tools/gif-tools/gif-to-apng' },
    { name: 'Image to GIF', href: '/tools/gif-tools/image-to-gif' },
    { name: 'GIF Maker', href: '/tools/gif-tools/gif-maker' },
    { name: 'GIF Compressor', href: '/tools/gif-tools/gif-compressor' },
  ],
  '/tools/audio-tools': [
    { name: 'Audio Converter', href: '/tools/audio-tools/audio-converter' },
    { name: 'Audio Trimmer', href: '/tools/audio-tools/audio-trimmer' },
    { name: 'Audio Compressor', href: '/tools/audio-tools/audio-compressor' },
    { name: 'Audio Merger', href: '/tools/audio-tools/audio-merger' },
    { name: 'Audio Splitter', href: '/tools/audio-tools/audio-splitter' },
    { name: 'Audio Booster', href: '/tools/audio-tools/audio-booster' },
    { name: 'Audio Equalizer', href: '/tools/audio-tools/audio-equalizer' },
    { name: 'Audio Waveform', href: '/tools/audio-tools/audio-waveform' },
    { name: 'Audio Metadata', href: '/tools/audio-tools/audio-metadata' },
    { name: 'Voice Recorder', href: '/tools/audio-tools/voice-recorder' },
    { name: 'Audio to Text', href: '/tools/audio-tools/audio-to-text' },
  ],
  '/tools/video-tools': [
    { group: 'Edit & Transform', items: [
      { name: 'Video Trimmer', href: '/tools/video-tools/video-trimmer' },
      { name: 'Video Merger', href: '/tools/video-tools/video-merger' },
      { name: 'Video Rotator', href: '/tools/video-tools/video-rotator' },
      { name: 'Video Resizer', href: '/tools/video-tools/video-resizer' },
      { name: 'Video Filter', href: '/tools/video-tools/video-filter' },
      { name: 'Video Watermark', href: '/tools/video-tools/video-watermark' },
      { name: 'Video Compressor', href: '/tools/video-tools/video-compressor' },
    ]},
    { group: 'Convert', items: [
      { name: 'Video Converter', href: '/tools/video-tools/video-converter' },
      { name: 'Video to Audio', href: '/tools/video-tools/video-to-audio' },
      { name: 'Video to GIF', href: '/tools/video-tools/video-to-gif' },
    ]},
    { group: 'Capture & Record', items: [
      { name: 'Screen Recorder', href: '/tools/video-tools/screen-recorder' },
      { name: 'Video Screenshot', href: '/tools/video-tools/video-screenshot' },
      { name: 'Media Player', href: '/tools/video-tools/media-player' },
    ]},
    { group: 'Info & Extras', items: [
      { name: 'Video Metadata', href: '/tools/video-tools/video-metadata' },
      { name: 'Subtitle Generator', href: '/tools/video-tools/subtitle-generator' },
    ]},
  ],
  '/tools/text-tools': [
    { group: 'Count & Analyze', items: [
      { name: 'Word Counter', href: '/tools/text-tools/word-counter' },
      { name: 'Character Counter', href: '/tools/text-tools/character-counter' },
      { name: 'Text Comparator', href: '/tools/text-tools/text-comparator' },
    ]},
    { group: 'Transform & Format', items: [
      { name: 'Case Converter', href: '/tools/text-tools/case-converter' },
      { name: 'Text Reverser', href: '/tools/text-tools/text-reverser' },
      { name: 'Text Sorter', href: '/tools/text-tools/text-sorter' },
      { name: 'Whitespace Remover', href: '/tools/text-tools/whitespace-remover' },
      { name: 'Text to List', href: '/tools/text-tools/text-to-list' },
      { name: 'Text Truncator', href: '/tools/text-tools/text-truncator' },
      { name: 'Text Repeater', href: '/tools/text-tools/text-repeater' },
      { name: 'Duplicate Remover', href: '/tools/text-tools/duplicate-remover' },
    ]},
    { group: 'Find & Secure', items: [
      { name: 'Find & Replace', href: '/tools/text-tools/find-replace' },
      { name: 'URL Encoder', href: '/tools/text-tools/url-encoder' },
      { name: 'Text Encryptor', href: '/tools/text-tools/text-encryptor' },
    ]},
    { group: 'Generate & Create', items: [
      { name: 'Lorem Ipsum', href: '/tools/text-tools/lorem-ipsum' },
      { name: 'ASCII Art', href: '/tools/text-tools/ascii-art' },
      { name: 'Sticky Notes', href: '/tools/text-tools/sticky-notes' },
    ]},
  ],
  '/tools/file-tools': [
    { name: 'ZIP Creator', href: '/tools/file-tools/zip-creator' },
    { name: 'ZIP Extractor', href: '/tools/file-tools/zip-extractor' },
    { name: 'TAR Extractor', href: '/tools/file-tools/tar-extractor' },
    { name: 'File Converter', href: '/tools/file-tools/file-converter' },
    { name: 'File Encryptor', href: '/tools/file-tools/file-encryptor' },
    { name: 'File Metadata', href: '/tools/file-tools/file-metadata' },
    { name: 'File Comparator', href: '/tools/file-tools/file-comparator' },
    { name: 'File Splitter', href: '/tools/file-tools/file-splitter' },
    { name: 'Base64 Encoder', href: '/tools/file-tools/base64-encoder' },
  ],
  '/tools/qr-barcodes-tools': [
    { name: 'QR Generator', href: '/tools/qr-barcodes-tools/qr-generator' },
    { name: 'QR Scanner', href: '/tools/qr-barcodes-tools/qr-scanner' },
    { name: 'Barcode Generator', href: '/tools/qr-barcodes-tools/barcode-generator' },
  ],
  '/tools/converter-tools': [
    { name: 'Currency Converter', href: '/tools/converter-tools/currency-converter' },
    { name: 'Unit Converter', href: '/tools/converter-tools/unit-converter' },
    { name: 'Color Converter', href: '/tools/converter-tools/color-converter' },
    { name: 'MOBI to EPUB', href: '/tools/converter-tools/mobi-to-epub' },
  ],
  '/tools/developer-tools': [
    { group: 'JSON Tools', items: [
      { name: 'JSON Formatter', href: '/tools/developer-tools/json-formatter' },
      { name: 'JSON Minifier', href: '/tools/developer-tools/json-minifier' },
      { name: 'JSON to CSV', href: '/tools/developer-tools/json-to-csv' },
      { name: 'JSON to XML', href: '/tools/developer-tools/json-to-xml' },
      { name: 'JSON to YAML', href: '/tools/developer-tools/json-to-yaml' },
      { name: 'JSON to TOML', href: '/tools/developer-tools/json-to-toml' },
      { name: 'JSON to TypeScript', href: '/tools/developer-tools/json-to-typescript' },
      { name: 'JSON to Python', href: '/tools/developer-tools/json-to-python' },
      { name: 'JSON to Go', href: '/tools/developer-tools/json-to-go' },
      { name: 'JSON to PHP', href: '/tools/developer-tools/json-to-php' },
      { name: 'JSON to C#', href: '/tools/developer-tools/json-to-csharp' },
      { name: 'JSON to Rust', href: '/tools/developer-tools/json-to-rust' },
    ]},
    { group: 'Data Format Convert', items: [
      { name: 'XML Formatter', href: '/tools/developer-tools/xml-formatter' },
      { name: 'XML to JSON', href: '/tools/developer-tools/xml-to-json' },
      { name: 'YAML to JSON', href: '/tools/developer-tools/yaml-to-json' },
      { name: 'TOML to JSON', href: '/tools/developer-tools/toml-to-json' },
      { name: 'CSV to JSON', href: '/tools/developer-tools/csv-to-json' },
      { name: 'CSV to Excel', href: '/tools/developer-tools/csv-to-excel' },
      { name: 'CSV to SQL', href: '/tools/developer-tools/csv-to-sql' },
      { name: 'CSV to TSV', href: '/tools/developer-tools/csv-to-tsv' },
      { name: 'Excel to CSV', href: '/tools/developer-tools/excel-to-csv' },
      { name: 'Excel to JSON', href: '/tools/developer-tools/excel-to-json' },
      { name: 'SQL to CSV', href: '/tools/developer-tools/sql-to-csv' },
      { name: 'TSV to CSV', href: '/tools/developer-tools/tsv-to-csv' },
    ]},
    { group: 'Web & Text Encoding', items: [
      { name: 'Base64 Encoder', href: '/tools/developer-tools/base64-encoder' },
      { name: 'URL Encoder', href: '/tools/developer-tools/url-encoder' },
      { name: 'URL Parser', href: '/tools/developer-tools/url-parser' },
      { name: 'HTML Formatter', href: '/tools/developer-tools/html-formatter' },
      { name: 'HTML Encoder', href: '/tools/developer-tools/html-encoder' },
      { name: 'HTML Entity Decoder', href: '/tools/developer-tools/html-entity-decoder' },
      { name: 'Hex to Text', href: '/tools/developer-tools/hex-to-text' },
      { name: 'Unicode Converter', href: '/tools/developer-tools/unicode-converter' },
    ]},
    { group: 'Code Formatting', items: [
      { name: 'CSS Formatter', href: '/tools/developer-tools/css-formatter' },
      { name: 'SCSS to CSS', href: '/tools/developer-tools/scss-to-css' },
      { name: 'JS Formatter', href: '/tools/developer-tools/javascript-formatter' },
      { name: 'JS Minifier', href: '/tools/developer-tools/js-minifier' },
      { name: 'TypeScript to JS', href: '/tools/developer-tools/typescript-to-js' },
      { name: 'SQL Formatter', href: '/tools/developer-tools/sql-formatter' },
      { name: 'Markdown Editor', href: '/tools/developer-tools/markdown-editor' },
      { name: 'Markdown Previewer', href: '/tools/developer-tools/markdown-previewer' },
      { name: 'Markdown to HTML', href: '/tools/developer-tools/markdown-to-html' },
      { name: 'Code Formatter', href: '/tools/developer-tools/code-formatter' },
      { name: 'Code Minifier', href: '/tools/developer-tools/code-minifier' },
    ]},
    { group: 'Generators & Security', items: [
      { name: 'Hash Generator', href: '/tools/developer-tools/hash-generator' },
      { name: 'UUID Generator', href: '/tools/developer-tools/uuid-generator' },
      { name: 'Password Generator', href: '/tools/developer-tools/password-generator' },
      { name: 'JWT Decoder', href: '/tools/developer-tools/jwt-decoder' },
      { name: 'Regex Tester', href: '/tools/developer-tools/regex-tester' },
      { name: 'Diff Viewer', href: '/tools/developer-tools/diff-viewer' },
    ]},
    { group: 'Utilities', items: [
      { name: 'Color Picker', href: '/tools/developer-tools/color-picker' },
      { name: 'Aspect Ratio', href: '/tools/developer-tools/aspect-ratio' },
      { name: 'Timestamp Converter', href: '/tools/developer-tools/timestamp-converter' },
      { name: 'Cron Expression', href: '/tools/developer-tools/cron-expression' },
      { name: 'Cron Builder', href: '/tools/developer-tools/cron-expression-builder' },
      { name: 'Number Base Converter', href: '/tools/developer-tools/number-base-converter' },
      { name: 'ENV to JSON', href: '/tools/developer-tools/env-to-json' },
      { name: 'API Tester', href: '/tools/developer-tools/api-tester' },
    ]},
  ],
  '/tools/math-tools': [
    { name: 'Scientific Calculator', href: '/tools/math-tools/scientific-calculator' },
    { name: 'Percentage Calculator', href: '/tools/math-tools/percentage-calculator' },
    { name: 'Fraction Calculator', href: '/tools/math-tools/fraction-calculator' },
    { name: 'Statistics Calculator', href: '/tools/math-tools/statistics-calculator' },
    { name: 'Roman Numeral Converter', href: '/tools/math-tools/roman-numeral-converter' },
    { name: 'Number Base Converter', href: '/tools/math-tools/number-base-converter' },
  ],
  '/tools/ai-tools': [
    { group: 'Writing & Language', items: [
      { name: 'Grammar Fixer', href: '/tools/ai-tools/grammar-fixer' },
      { name: 'AI Writer', href: '/tools/ai-tools/ai-writer' },
      { name: 'AI Paraphraser', href: '/tools/ai-tools/ai-paraphraser' },
      { name: 'Text Summarizer', href: '/tools/ai-tools/text-summarizer' },
      { name: 'AI Detector', href: '/tools/ai-tools/ai-detector' },
    ]},
    { group: 'Chat, Translate & Generate', items: [
      { name: 'AI Chatbot', href: '/tools/ai-tools/ai-chatbot' },
      { name: 'AI Translator', href: '/tools/ai-tools/ai-translator' },
      { name: 'Email Generator', href: '/tools/ai-tools/email-generator' },
    ]},
    { group: 'Image AI', items: [
      { name: 'Image Generator', href: '/tools/ai-tools/image-generator' },
      { name: 'Background Remover', href: '/tools/ai-tools/background-remover' },
      { name: 'Image Upscaler', href: '/tools/ai-tools/image-upscaler' },
      { name: 'Image Captioner', href: '/tools/ai-tools/image-captioner' },
    ]},
    { group: 'Audio & Data Analysis', items: [
      { name: 'Audio Transcriber', href: '/tools/ai-tools/audio-transcriber' },
      { name: 'Keyword Extractor', href: '/tools/ai-tools/keyword-extractor' },
      { name: 'Sentiment Analyzer', href: '/tools/ai-tools/sentiment-analyzer' },
      { name: 'Data Extractor', href: '/tools/ai-tools/data-extractor' },
    ]},
  ],
};

const languages = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'zh-CN', label: 'Chinese', short: 'CN' },
  { code: 'ar', label: 'العربية', short: 'AR' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'pt', label: 'Português', short: 'PT' },
  { code: 'ja', label: 'Japanese', short: 'JP' },
  { code: 'ru', label: 'Russian', short: 'RU' },
  { code: 'it', label: 'Italiano', short: 'IT' },
  { code: 'ko', label: 'Korean', short: 'KO' },
  { code: 'hi', label: 'Hindi', short: 'HI' },
  { code: 'tr', label: 'Türkçe', short: 'TR' },
];

const allTools = [
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
  { name: 'Video to GIF',         href: '/tools/video-tools/video-to-gif' },
  { name: 'GIF Maker',            href: '/tools/gif-tools/gif-maker' },
  { name: 'GIF Compressor',       href: '/tools/gif-tools/gif-compressor' },
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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const searchWrapRef = useRef(null);
  const [langOpen, setLangOpen] = useState(false);
  const [openCat, setOpenCat] = useState(null);
  const catTimerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(60);
  const [currentLang, setCurrentLang] = useState(languages[0]);
  const langRef = useRef(null);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenCat, setMobileOpenCat] = useState(null);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileOpenCat(null);
    setMobileLangOpen(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setDark(saved === 'dark');
  }, []);

  useEffect(() => {
    const syncDirFromTranslation = () => {
      const cls = document.documentElement.className;
      if (cls.includes('translated-rtl')) document.documentElement.dir = 'rtl';
      else if (cls.includes('translated-ltr')) document.documentElement.dir = 'ltr';
    };
    syncDirFromTranslation();
    const observer = new MutationObserver(syncDirFromTranslation);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const measure = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setSearchPanelOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) closeMobileMenu();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length > 1) {
      setResults(allTools.filter(t => t.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6));
    } else {
      setResults([]);
    }
  };

  const changeLanguage = (lang) => {
    setCurrentLang(lang);
    setLangOpen(false);
    document.documentElement.dir = lang.code === 'ar' ? 'rtl' : 'ltr';
    const tryTranslate = (attempts) => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = lang.code;
        select.dispatchEvent(new Event('change'));
      } else if (attempts > 0) {
        setTimeout(() => tryTranslate(attempts - 1), 500);
      }
    };
    tryTranslate(10);
  };

  return (
    <>
      <style>{`
        @keyframes pulse-glow { 0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(153,53,86,0.4); } 50% { opacity:0.85; box-shadow:0 0 0 6px rgba(153,53,86,0); } }
      `}</style>

      <header ref={headerRef} className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">

        {/* â”€â”€ Main navbar â”€â”€ */}
        <div className="w-full px-4 min-[1024px]:px-3 min-[1410px]:px-4 py-2 flex items-center gap-1 min-[1410px]:gap-2" style={{ minHeight: '52px' }}>

          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center gap-1.5 lg:gap-2 px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition notranslate">
              <svg
                className="w-7 h-7 lg:w-9 lg:h-9 xl:w-[46px] xl:h-[46px]"
                viewBox="0 0 64 64"
                style={{ animation: "pulse-glow 2s ease-in-out infinite", flexShrink: 0, borderRadius: "8px" }}
                aria-hidden="true"
              >
                <rect x="4" y="4" width="56" height="56" rx="14" fill={dark ? '#378add' : '#185fa5'} />
                <rect x="16" y="16" width="18" height="18" rx="4" fill="#F4C0D1" />
                <circle cx="42" cy="20" r="2.5" fill="#F4C0D1" />
                <circle cx="48" cy="26" r="2" fill="#ED93B1" />
                <circle cx="44" cy="34" r="1.5" fill="#D4537E" />
                <circle cx="20" cy="42" r="2.5" fill="#F4C0D1" />
                <circle cx="28" cy="46" r="2" fill="#ED93B1" />
              </svg>
              <span className={`${poppinsMedium.className} text-[12px] lg:text-[21px] xl:text-[30px] text-black dark:text-white whitespace-nowrap`}>
                <span className="text-[#185fa5] dark:text-[#85b7eb]">O</span>nline<span className="text-[#185fa5] dark:text-[#85b7eb]">C</span>onver<span className="text-[#185fa5] dark:text-[#85b7eb]">T</span>ools
              </span>
            </Link>
          </div>

          {/* Categories */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-0 min-[1410px]:gap-0.5">
            {categories.map((cat) => {
              const dropTools = categoryTools[cat.href] || [];
              const isGrouped = dropTools.length > 0 && Boolean(dropTools[0].items);
              const isActive = pathname.startsWith(cat.href);
              const catSlug = cat.href.split('/').pop();
              const catColor = categoryColors[catSlug];
              return (
                <div
                  key={cat.href}
                  className="relative flex items-stretch"
                  onMouseEnter={() => { clearTimeout(catTimerRef.current); setOpenCat(cat.href); }}
                  onMouseLeave={() => { catTimerRef.current = setTimeout(() => setOpenCat(null), 150); }}
                >
                  <Link
                    href={cat.href}
                    title={cat.label}
                    className={`flex items-center gap-0.5 min-[1410px]:gap-1 px-0.5 min-[1410px]:px-2 py-1 text-[11px] min-[1410px]:text-xs font-bold uppercase tracking-wide transition border-b-2 text-black dark:text-white ${isActive ? 'border-current' : 'border-transparent hover:opacity-60'}`}
                  >
                    <span className="flex items-center justify-center shrink-0 rounded-md bg-neutral-100 dark:bg-neutral-800 w-[29px] h-[29px]">
                      <cat.icon className={`w-[21px] h-[21px] ${catColor}`} aria-hidden="true" />
                    </span>
                    <span className="sr-only min-[2100px]:not-sr-only min-[2100px]:truncate min-[2100px]:max-w-[64px]">{cat.label}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-2.5 h-2.5 shrink-0 opacity-50 transition-transform ${openCat === cat.href ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>
                  {openCat === cat.href && dropTools.length > 0 && isGrouped && (
                    <div
                      className={`fixed left-1/2 -translate-x-1/2 grid grid-cols-4 ${xlGridColsByGroupCount[dropTools.length] || 'xl:grid-cols-4'} gap-x-4 gap-y-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-[9999] p-4 w-[820px] ${widthByGroupCount[dropTools.length] || 'xl:w-[1400px]'} max-w-[calc(100vw-32px)]`}
                      style={{ top: headerHeight, maxHeight: '85vh', overflowY: 'auto' }}
                      onMouseEnter={() => { clearTimeout(catTimerRef.current); setOpenCat(cat.href); }}
                      onMouseLeave={() => { catTimerRef.current = setTimeout(() => setOpenCat(null), 300); }}
                    >
                      {dropTools.map((group) => (
                        <div key={group.group} className="min-w-0">
                          <div className="text-sm font-bold uppercase tracking-wide text-neutral-800 dark:text-neutral-100 mb-1.5 px-2">
                            {group.group}
                          </div>
                          <div className="flex flex-col">
                            {group.items.map((tool) => (
                              <Link
                                key={tool.href}
                                href={tool.href}
                                onClick={() => setOpenCat(null)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition"
                              >
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toolBgColors[tool.href] || 'bg-neutral-400'}`}>
                                  <ToolIcon slug={tool.href.split('/').pop()} className="w-4 h-4 text-white" />
                                </span>
                                {tool.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {openCat === cat.href && dropTools.length > 0 && !isGrouped && (
                    <div
                      className={`absolute top-full ${flatEndAnchoredCategories.has(cat.href) ? 'end-0' : 'start-0'} mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-[9999] p-2 ${flatTwoColumnCategories.has(cat.href) ? 'grid grid-cols-2 gap-x-2 gap-y-0.5 w-[420px]' : 'flex flex-col gap-0.5 w-64'}`}
                      style={{ maxHeight: '85vh', overflowY: 'auto' }}
                      onMouseEnter={() => { clearTimeout(catTimerRef.current); setOpenCat(cat.href); }}
                      onMouseLeave={() => { catTimerRef.current = setTimeout(() => setOpenCat(null), 300); }}
                    >
                      {dropTools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          onClick={() => setOpenCat(null)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition"
                        >
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toolBgColors[tool.href] || 'bg-neutral-400'}`}>
                            <ToolIcon slug={tool.href.split('/').pop()} className="w-4 h-4 text-white" />
                          </span>
                          {tool.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="shrink-0 flex items-center gap-1.5 min-[1024px]:gap-1 min-[1410px]:gap-1.5 justify-end">

            {/* Mobile menu (categories + language + dark mode) -- below 1024px only, where all three are otherwise unreachable */}
            <div className="relative lg:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => (mobileMenuOpen ? closeMobileMenu() : setMobileMenuOpen(true))}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu-panel"
                className="flex items-center justify-center w-8 h-7 rounded-lg bg-[#eaf3fb] dark:bg-[#16283a] text-[#185fa5] dark:text-[#85b7eb] hover:opacity-80 transition"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
              </button>

              {mobileMenuOpen && (
                <div
                  id="mobile-menu-panel"
                  className="fixed inset-x-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-[9999] p-2 overflow-y-auto"
                  style={{ top: headerHeight + 4, maxHeight: `calc(100vh - ${headerHeight + 12}px)` }}
                >
                  <div className="flex flex-col gap-0.5">
                    {categories.map((cat) => {
                      const dropTools = categoryTools[cat.href] || [];
                      const isGrouped = dropTools.length > 0 && Boolean(dropTools[0].items);
                      const catSlug = cat.href.split('/').pop();
                      const catColor = categoryColors[catSlug];
                      const expanded = mobileOpenCat === cat.href;
                      return (
                        <div key={cat.href} className="border-b border-neutral-100 dark:border-neutral-700 last:border-b-0">
                          <div className="flex items-center">
                            <Link
                              href={cat.href}
                              onClick={closeMobileMenu}
                              className="flex items-center gap-2 flex-1 min-w-0 px-2 py-2 text-sm font-bold uppercase tracking-wide text-black dark:text-white"
                            >
                              <span className="flex items-center justify-center shrink-0 rounded-md bg-neutral-100 dark:bg-neutral-800 w-8 h-8">
                                <cat.icon className={`w-[18px] h-[18px] ${catColor}`} aria-hidden="true" />
                              </span>
                              <span className="truncate">{cat.label}</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => setMobileOpenCat(expanded ? null : cat.href)}
                              aria-expanded={expanded}
                              aria-label={`${expanded ? 'Collapse' : 'Expand'} ${cat.label}`}
                              className="shrink-0 p-2.5"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 opacity-50 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                          {expanded && (
                            <div className="pb-2 ps-4">
                              {isGrouped ? dropTools.map((group) => (
                                <div key={group.group} className="mb-2">
                                  <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-2 mb-0.5">
                                    {group.group}
                                  </div>
                                  {group.items.map((tool) => (
                                    <Link
                                      key={tool.href}
                                      href={tool.href}
                                      onClick={closeMobileMenu}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition"
                                    >
                                      <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${toolBgColors[tool.href] || 'bg-neutral-400'}`}>
                                        <ToolIcon slug={tool.href.split('/').pop()} className="w-3 h-3 text-white" />
                                      </span>
                                      {tool.name}
                                    </Link>
                                  ))}
                                </div>
                              )) : dropTools.map((tool) => (
                                <Link
                                  key={tool.href}
                                  href={tool.href}
                                  onClick={closeMobileMenu}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition"
                                >
                                  <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${toolBgColors[tool.href] || 'bg-neutral-400'}`}>
                                    <ToolIcon slug={tool.href.split('/').pop()} className="w-3 h-3 text-white" />
                                  </span>
                                  {tool.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Language */}
                  <div className="mt-1 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setMobileLangOpen(!mobileLangOpen)}
                      aria-expanded={mobileLangOpen}
                      className="flex items-center gap-2 w-full px-2 py-2 text-sm font-bold text-black dark:text-white"
                    >
                      <span className="flex items-center justify-center shrink-0 rounded-md bg-[#eaf3fb] dark:bg-[#16283a] text-[#185fa5] dark:text-[#85b7eb] w-8 h-8 text-xs font-bold">
                        {currentLang.short}
                      </span>
                      <span className="flex-1 text-start">{currentLang.label}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 opacity-50 transition-transform ${mobileLangOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {mobileLangOpen && (
                      <div className="ps-4 pb-1 grid grid-cols-2 gap-x-2 gap-y-0.5 max-h-48 overflow-y-auto">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => { changeLanguage(lang); setMobileLangOpen(false); }}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-start hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition ${currentLang.code === lang.code ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900 font-bold' : 'text-neutral-700 dark:text-neutral-200'}`}
                          >
                            <span className="font-bold w-6 shrink-0">{lang.short}</span>
                            <span className="truncate">{lang.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dark mode */}
                  <div className="pt-1 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setDark(!dark)}
                      className="flex items-center gap-2 w-full px-2 py-2 text-sm font-bold text-black dark:text-white"
                    >
                      <span className="flex items-center justify-center shrink-0 rounded-md bg-[#eaf3fb] dark:bg-[#16283a] text-[#185fa5] dark:text-[#85b7eb] w-8 h-8">
                        {dark ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        )}
                      </span>
                      <span>{dark ? 'Light mode' : 'Dark mode'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative" ref={searchWrapRef}>
              {/* Inline field: only wide desktop (>=1536), where there's room for it in the row.
                  Below that (including mobile, freed up now for the hamburger) the compact icon
                  trigger below opens the same floating panel used by the mega-menu/search pattern. */}
              <div className="relative hidden min-[1536px]:block">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#185fa5] dark:text-[#85b7eb] pointer-events-none" aria-hidden="true" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search tools..."
                  className="w-16 lg:w-36 bg-[#f5f5f7] dark:bg-[#2a2a2a] rounded-full ps-8 pe-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 text-neutral-700 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                />
                {results.length > 0 && (
                  <div className="absolute top-full end-0 mt-1 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg z-[9999]">
                    {results.map((r) => (
                      <Link
                        key={r.href}
                        href={r.href}
                        onClick={() => { setSearch(''); setResults([]); }}
                        className="block px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition"
                      >
                        {r.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Compact trigger: below 1536px (mobile included), where the row has no room for even a narrow inline field */}
              <button
                type="button"
                onClick={() => setSearchPanelOpen(true)}
                aria-label="Search tools"
                className="flex min-[1536px]:hidden items-center justify-center w-8 h-7 rounded-lg bg-[#eaf3fb] dark:bg-[#16283a] text-[#185fa5] dark:text-[#85b7eb] hover:opacity-80 transition"
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* Floating panel for the compact trigger: anchored below the header (like the flat-category dropdowns),
                  never overlapping sibling nav pills the way an in-row absolute-expand would. */}
              {searchPanelOpen && (
                <div
                  className="fixed end-2 min-[1536px]:hidden bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-[9999] p-2 w-72 max-w-[calc(100vw-16px)]"
                  style={{ top: headerHeight + 4 }}
                >
                  <div className="relative">
                    <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#185fa5] dark:text-[#85b7eb] pointer-events-none" aria-hidden="true" />
                    <input
                      autoFocus
                      type="text"
                      value={search}
                      onChange={handleSearch}
                      placeholder="Search tools..."
                      className="w-full bg-[#f5f5f7] dark:bg-[#2a2a2a] rounded-full ps-8 pe-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 text-neutral-700 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                    />
                  </div>
                  {results.length > 0 && (
                    <div className="mt-1 max-h-72 overflow-y-auto">
                      {results.map((r) => (
                        <Link
                          key={r.href}
                          href={r.href}
                          onClick={() => { setSearch(''); setResults([]); setSearchPanelOpen(false); }}
                          className="block px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition rounded-lg"
                        >
                          {r.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative notranslate hidden lg:block" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-[#eaf3fb] dark:bg-[#16283a] hover:opacity-80 transition text-[#185fa5] dark:text-[#85b7eb] text-xs font-bold"
              >
                <span>{currentLang.short}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute top-full end-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-indigo-50 hover:text-indigo-600 transition text-start ${currentLang.code === lang.code ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-neutral-700 dark:text-neutral-200'}`}
                    >
                      <span className="font-bold w-5">{lang.short}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode */}
            <button
              onClick={() => setDark(!dark)}
              className="p-1 rounded-lg bg-[#eaf3fb] dark:bg-[#16283a] hover:opacity-80 transition text-[#185fa5] dark:text-[#85b7eb] shrink-0 hidden lg:block"
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Login / Account */}
            {user ? (
              <div className="relative notranslate" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-700 dark:text-neutral-200 text-xs font-bold whitespace-nowrap"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] shrink-0">
                    {(user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[90px] truncate">{user.user_metadata?.full_name || user.email}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full end-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg z-50">
                    <div className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400 truncate border-b border-neutral-100 dark:border-neutral-700">
                      {user.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-start px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition rounded-b-xl"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/signin" className="flex items-center px-1.5 min-[1410px]:px-2.5 py-1 rounded-lg bg-[#185fa5] dark:bg-[#378add] hover:opacity-90 transition text-white text-xs font-bold whitespace-nowrap">
                Sign In
              </Link>
            )}

          </div>
        </div>

      </header>
    </>
  );
}

