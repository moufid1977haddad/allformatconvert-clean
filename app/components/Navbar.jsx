'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ToolIcon } from '@/app/lib/toolIcons';

const categories = [
  { href: '/tools/pdf-tools', label: 'PDF' },
  { href: '/tools/image-tools', label: 'Image' },
  { href: '/tools/gif-tools', label: 'GIF' },
  { href: '/tools/audio-tools', label: 'Audio' },
  { href: '/tools/video-tools', label: 'Video' },
  { href: '/tools/text-tools', label: 'Text' },
  { href: '/tools/file-tools', label: 'File' },
  { href: '/tools/qr-barcodes-tools', label: 'QR' },
  { href: '/tools/converter-tools', label: 'Convert' },
  { href: '/tools/developer-tools', label: 'Dev' },
  { href: '/tools/math-tools', label: 'Math' },
  { href: '/tools/ai-tools', label: 'AI' },
];

const categoryTools = {
  '/tools/pdf-tools': [
    { name: 'Merge PDF', href: '/tools/pdf-tools/pdf-merge' },
    { name: 'Split PDF', href: '/tools/pdf-tools/pdf-split' },
    { name: 'Compress PDF', href: '/tools/pdf-tools/pdf-compress' },
    { name: 'Protect PDF', href: '/tools/pdf-tools/pdf-protect' },
    { name: 'Unlock PDF', href: '/tools/pdf-tools/pdf-unlock' },
    { name: 'Rotate PDF', href: '/tools/pdf-tools/pdf-rotate' },
    { name: 'Watermark PDF', href: '/tools/pdf-tools/pdf-watermark' },
    { name: 'Image to PDF', href: '/tools/pdf-tools/image-to-pdf' },
    { name: 'PDF to Image', href: '/tools/pdf-tools/pdf-to-image' },
    { name: 'PDF to JPG', href: '/tools/pdf-tools/pdf-to-jpg' },
    { name: 'JPG to PDF', href: '/tools/pdf-tools/jpg-to-pdf' },
    { name: 'Word to PDF', href: '/tools/pdf-tools/word-to-pdf' },
    { name: 'PDF to Word', href: '/tools/pdf-tools/pdf-to-word' },
    { name: 'Excel to PDF', href: '/tools/pdf-tools/excel-to-pdf' },
    { name: 'PDF to Excel', href: '/tools/pdf-tools/pdf-to-excel' },
    { name: 'PDF to PPT', href: '/tools/pdf-tools/pdf-to-ppt' },
    { name: 'PPT to PDF', href: '/tools/pdf-tools/ppt-to-pdf' },
    { name: 'HTML to PDF', href: '/tools/pdf-tools/html-to-pdf' },
    { name: 'Text to PDF', href: '/tools/pdf-tools/text-to-pdf' },
    { name: 'Markdown to PDF', href: '/tools/pdf-tools/markdown-to-pdf' },
    { name: 'EPUB to PDF', href: '/tools/pdf-tools/epub-to-pdf' },
    { name: 'MOBI to PDF', href: '/tools/pdf-tools/mobi-to-pdf' },
    { name: 'PDF to HTML', href: '/tools/pdf-tools/pdf-to-html' },
    { name: 'Delete Pages', href: '/tools/pdf-tools/pdf-delete-pages' },
    { name: 'Reorder Pages', href: '/tools/pdf-tools/pdf-reorder-pages' },
    { name: 'Organize PDF', href: '/tools/pdf-tools/pdf-organize' },
    { name: 'Extract Text', href: '/tools/pdf-tools/pdf-extract-text' },
    { name: 'Number Pages', href: '/tools/pdf-tools/pdf-number-pages' },
    { name: 'PDF Editor', href: '/tools/pdf-tools/pdf-editor' },
    { name: 'Sign PDF', href: '/tools/pdf-tools/pdf-sign' },
    { name: 'PDF OCR', href: '/tools/pdf-tools/pdf-ocr' },
    { name: 'PDF Forms', href: '/tools/pdf-tools/pdf-forms' },
    { name: 'Redact PDF', href: '/tools/pdf-tools/pdf-redact' },
    { name: 'Crop PDF', href: '/tools/pdf-tools/pdf-crop' },
    { name: 'Compare PDF', href: '/tools/pdf-tools/pdf-compare' },
    { name: 'PDF to PDF/A', href: '/tools/pdf-tools/pdf-to-pdfa' },
    { name: 'Repair PDF', href: '/tools/pdf-tools/pdf-repair' },
    { name: 'AI PDF Summary', href: '/tools/pdf-tools/pdf-ai-summary' },
    { name: 'Translate PDF', href: '/tools/pdf-tools/pdf-translate' },
  ],
  '/tools/image-tools': [
    { name: 'Image Compressor', href: '/tools/image-tools/image-compressor' },
    { name: 'Image Converter', href: '/tools/image-tools/image-converter' },
    { name: 'Image Resizer', href: '/tools/image-tools/image-resizer' },
    { name: 'Image Cropper', href: '/tools/image-tools/image-cropper' },
    { name: 'Image Rotate', href: '/tools/image-tools/image-rotate' },
    { name: 'Image Flip', href: '/tools/image-tools/image-flip' },
    { name: 'Image Editor', href: '/tools/image-tools/image-editor' },
    { name: 'Add Text to Image', href: '/tools/image-tools/add-text-to-image' },
    { name: 'Add Border', href: '/tools/image-tools/add-border-to-image' },
    { name: 'Brightness & Contrast', href: '/tools/image-tools/brightness-contrast' },
    { name: 'Grayscale Converter', href: '/tools/image-tools/grayscale-converter' },
    { name: 'Image Blur', href: '/tools/image-tools/image-blur' },
    { name: 'Image Inverter', href: '/tools/image-tools/image-inverter' },
    { name: 'Sepia Filter', href: '/tools/image-tools/sepia-filter' },
    { name: 'Image Metadata', href: '/tools/image-tools/image-metadata' },
    { name: 'Image Pixelator', href: '/tools/image-tools/image-pixelator' },
    { name: 'Round Corners', href: '/tools/image-tools/round-corners' },
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
    { name: 'Image to Base64', href: '/tools/image-tools/image-to-base64' },
    { name: 'Duplicate Finder', href: '/tools/image-tools/duplicate-image-finder' },
    { name: 'Image Comparison', href: '/tools/image-tools/image-comparison' },
    { name: 'Add Noise', href: '/tools/image-tools/add-noise' },
    { name: 'Add Vignette', href: '/tools/image-tools/add-vignette' },
    { name: 'GIF to PNG', href: '/tools/image-tools/gif-to-png' },
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
    { name: 'Video Converter', href: '/tools/video-tools/video-converter' },
    { name: 'Video Compressor', href: '/tools/video-tools/video-compressor' },
    { name: 'Video Trimmer', href: '/tools/video-tools/video-trimmer' },
    { name: 'Video to Audio', href: '/tools/video-tools/video-to-audio' },
    { name: 'Video to GIF', href: '/tools/video-tools/video-to-gif' },
    { name: 'Video Screenshot', href: '/tools/video-tools/video-screenshot' },
    { name: 'Video Merger', href: '/tools/video-tools/video-merger' },
    { name: 'Video Rotator', href: '/tools/video-tools/video-rotator' },
    { name: 'Video Resizer', href: '/tools/video-tools/video-resizer' },
    { name: 'Video Filter', href: '/tools/video-tools/video-filter' },
    { name: 'Video Watermark', href: '/tools/video-tools/video-watermark' },
    { name: 'Video Metadata', href: '/tools/video-tools/video-metadata' },
    { name: 'Subtitle Generator', href: '/tools/video-tools/subtitle-generator' },
    { name: 'Screen Recorder', href: '/tools/video-tools/screen-recorder' },
    { name: 'Media Player', href: '/tools/video-tools/media-player' },
  ],
  '/tools/text-tools': [
    { name: 'Word Counter', href: '/tools/text-tools/word-counter' },
    { name: 'Character Counter', href: '/tools/text-tools/character-counter' },
    { name: 'Case Converter', href: '/tools/text-tools/case-converter' },
    { name: 'Text Reverser', href: '/tools/text-tools/text-reverser' },
    { name: 'Text Sorter', href: '/tools/text-tools/text-sorter' },
    { name: 'Find & Replace', href: '/tools/text-tools/find-replace' },
    { name: 'Text Comparator', href: '/tools/text-tools/text-comparator' },
    { name: 'Whitespace Remover', href: '/tools/text-tools/whitespace-remover' },
    { name: 'Lorem Ipsum', href: '/tools/text-tools/lorem-ipsum' },
    { name: 'URL Encoder', href: '/tools/text-tools/url-encoder' },
    { name: 'Text to List', href: '/tools/text-tools/text-to-list' },
    { name: 'Text Truncator', href: '/tools/text-tools/text-truncator' },
    { name: 'Text Repeater', href: '/tools/text-tools/text-repeater' },
    { name: 'Text Encryptor', href: '/tools/text-tools/text-encryptor' },
    { name: 'ASCII Art', href: '/tools/text-tools/ascii-art' },
    { name: 'Sticky Notes', href: '/tools/text-tools/sticky-notes' },
    { name: 'Duplicate Remover', href: '/tools/text-tools/duplicate-remover' },
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
    { name: 'Base64 Encoder', href: '/tools/developer-tools/base64-encoder' },
    { name: 'URL Encoder', href: '/tools/developer-tools/url-encoder' },
    { name: 'URL Parser', href: '/tools/developer-tools/url-parser' },
    { name: 'HTML Formatter', href: '/tools/developer-tools/html-formatter' },
    { name: 'HTML Encoder', href: '/tools/developer-tools/html-encoder' },
    { name: 'HTML Entity Decoder', href: '/tools/developer-tools/html-entity-decoder' },
    { name: 'CSS Formatter', href: '/tools/developer-tools/css-formatter' },
    { name: 'SCSS to CSS', href: '/tools/developer-tools/scss-to-css' },
    { name: 'JS Formatter', href: '/tools/developer-tools/javascript-formatter' },
    { name: 'JS Minifier', href: '/tools/developer-tools/js-minifier' },
    { name: 'TypeScript to JS', href: '/tools/developer-tools/typescript-to-js' },
    { name: 'SQL Formatter', href: '/tools/developer-tools/sql-formatter' },
    { name: 'Markdown Editor', href: '/tools/developer-tools/markdown-editor' },
    { name: 'Markdown Previewer', href: '/tools/developer-tools/markdown-previewer' },
    { name: 'Markdown to HTML', href: '/tools/developer-tools/markdown-to-html' },
    { name: 'Hash Generator', href: '/tools/developer-tools/hash-generator' },
    { name: 'UUID Generator', href: '/tools/developer-tools/uuid-generator' },
    { name: 'Password Generator', href: '/tools/developer-tools/password-generator' },
    { name: 'JWT Decoder', href: '/tools/developer-tools/jwt-decoder' },
    { name: 'Regex Tester', href: '/tools/developer-tools/regex-tester' },
    { name: 'Diff Viewer', href: '/tools/developer-tools/diff-viewer' },
    { name: 'Code Formatter', href: '/tools/developer-tools/code-formatter' },
    { name: 'Code Minifier', href: '/tools/developer-tools/code-minifier' },
    { name: 'Color Picker', href: '/tools/developer-tools/color-picker' },
    { name: 'Aspect Ratio', href: '/tools/developer-tools/aspect-ratio' },
    { name: 'Timestamp Converter', href: '/tools/developer-tools/timestamp-converter' },
    { name: 'Cron Builder', href: '/tools/developer-tools/cron-expression-builder' },
    { name: 'Hex to Text', href: '/tools/developer-tools/hex-to-text' },
    { name: 'Unicode Converter', href: '/tools/developer-tools/unicode-converter' },
    { name: 'Number Base Converter', href: '/tools/developer-tools/number-base-converter' },
    { name: 'ENV to JSON', href: '/tools/developer-tools/env-to-json' },
    { name: 'API Tester', href: '/tools/developer-tools/api-tester' },
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
    { name: 'AI Chatbot', href: '/tools/ai-tools/ai-chatbot' },
    { name: 'Grammar Fixer', href: '/tools/ai-tools/grammar-fixer' },
    { name: 'AI Translator', href: '/tools/ai-tools/ai-translator' },
    { name: 'AI Writer', href: '/tools/ai-tools/ai-writer' },
    { name: 'AI Detector', href: '/tools/ai-tools/ai-detector' },
    { name: 'AI Paraphraser', href: '/tools/ai-tools/ai-paraphraser' },
    { name: 'Text Summarizer', href: '/tools/ai-tools/text-summarizer' },
    { name: 'Image Generator', href: '/tools/ai-tools/image-generator' },
    { name: 'Background Remover', href: '/tools/ai-tools/background-remover' },
    { name: 'Image Upscaler', href: '/tools/ai-tools/image-upscaler' },
    { name: 'Image Captioner', href: '/tools/ai-tools/image-captioner' },
    { name: 'Audio Transcriber', href: '/tools/ai-tools/audio-transcriber' },
    { name: 'Email Generator', href: '/tools/ai-tools/email-generator' },
    { name: 'Keyword Extractor', href: '/tools/ai-tools/keyword-extractor' },
    { name: 'Sentiment Analyzer', href: '/tools/ai-tools/sentiment-analyzer' },
    { name: 'Data Extractor', href: '/tools/ai-tools/data-extractor' },
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

const tickerTools = [
  { label: 'Merge PDF',         href: '/tools/pdf-tools/pdf-merge' },
  { label: 'Resize Image',      href: '/tools/image-tools/image-resizer' },
  { label: 'Convert Video',     href: '/tools/video-tools/video-converter' },
  { label: 'Remove Background', href: '/tools/ai-tools/background-remover' },
  { label: 'Trim Audio',        href: '/tools/audio-tools/audio-trimmer' },
  { label: 'Format JSON',       href: '/tools/developer-tools/json-formatter' },
  { label: 'Encrypt PDF',       href: '/tools/pdf-tools/pdf-protect' },
  { label: 'Make GIF',          href: '/tools/gif-tools/gif-maker' },
  { label: 'Count Words',       href: '/tools/text-tools/word-counter' },
  { label: 'Convert Units',     href: '/tools/converter-tools/unit-converter' },
  { label: 'Encode Base64',     href: '/tools/developer-tools/base64-encoder' },
  { label: 'Generate QR Code',  href: '/tools/qr-barcodes-tools/qr-generator' },
  { label: 'Compress Files',    href: '/tools/file-tools/zip-creator' },
  { label: 'Convert Colors',    href: '/tools/converter-tools/color-converter' },
  { label: 'Extract Audio',     href: '/tools/video-tools/video-to-audio' },
  { label: 'Fix Grammar',       href: '/tools/ai-tools/grammar-fixer' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [langOpen, setLangOpen] = useState(false);
  const [openCat, setOpenCat] = useState(null);
  const catTimerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);
  const langRef = useRef(null);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  useEffect(() => {
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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

  const doubled = [...tickerTools, ...tickerTools];

  return (
    <>
      <style>{`
        @keyframes pulse-glow { 0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(99,102,241,0.4); } 50% { opacity:0.85; box-shadow:0 0 0 6px rgba(99,102,241,0); } }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 28s linear infinite;
        }
        .ticker-track:hover,
        .ticker-track:focus-within {
          animation-play-state: paused;
        }
      `}</style>

      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">

        {/* â”€â”€ Main navbar â”€â”€ */}
        <div className="w-full px-4 py-2 flex items-center gap-2" style={{ minHeight: '52px' }}>

          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition notranslate">
              <div style={{width:"28px",height:"28px",background:"#6366f1",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",animation:"pulse-glow 2s ease-in-out infinite",flexShrink:0}}>
                <span style={{color:"#fff",fontSize:"11px",fontWeight:"700"}}>OCT</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",lineHeight:"1.1"}}>
                <span style={{color:"#6366f1",fontSize:"15px",fontWeight:"800"}}>OnlineConver<span style={{color:"#4f46e5"}}>Tools</span></span>
                <span style={{color:"#a5b4fc",fontSize:"9px",letterSpacing:"1px"}}>FREE ONLINE TOOLS</span>
              </div>
            </Link>
          </div>

          {/* Categories */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-0.5">
            {categories.map((cat) => {
              const dropTools = categoryTools[cat.href] || [];
              const isActive = pathname.startsWith(cat.href);
              const baseClass = isActive
                ? 'text-indigo-600 border-indigo-300 bg-indigo-50'
                : 'text-[#6C5CE7] border-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white';
              return (
                <div
                  key={cat.href}
                  className="relative flex items-stretch"
                  onMouseEnter={() => { clearTimeout(catTimerRef.current); setOpenCat(cat.href); }}
                  onMouseLeave={() => { catTimerRef.current = setTimeout(() => setOpenCat(null), 150); }}
                >
                  <Link
                    href={cat.href}
                    className={`text-xs font-bold px-1.5 py-1 rounded-l-lg border-y border-l transition whitespace-nowrap ${baseClass}`}
                  >
                    {cat.label}
                  </Link>
                  <button
                    className={`flex items-center justify-center px-1 py-1 rounded-r-lg border-y border-r transition border-l-0 ${baseClass}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-2.5 h-2.5 opacity-50 transition-transform ${openCat === cat.href ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openCat === cat.href && dropTools.length > 0 && (
                    <div
                      className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-[9999]"
                      style={{ maxHeight: '240px', overflowY: 'auto' }}
                      onMouseEnter={() => { clearTimeout(catTimerRef.current); setOpenCat(cat.href); }}
                      onMouseLeave={() => { catTimerRef.current = setTimeout(() => setOpenCat(null), 300); }}
                    >
                      {dropTools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          onClick={() => setOpenCat(null)}
                          className="block px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition first:rounded-t-xl last:rounded-b-xl"
                        >
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
          <div className="shrink-0 flex items-center gap-1.5" style={{ width: '320px', justifyContent: 'flex-end' }}>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search tools..."
                className="w-36 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-indigo-400 text-neutral-700 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-400"
              />
              {results.length > 0 && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg z-[9999]">
                  {results.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={() => { setSearch(''); setResults([]); }}
                      className="block px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      {r.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative notranslate" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-700 dark:text-neutral-200 text-xs font-bold"
              >
                <span>{currentLang.short}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-indigo-50 hover:text-indigo-600 transition text-left ${currentLang.code === lang.code ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-neutral-700 dark:text-neutral-200'}`}
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
              className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-600 dark:text-neutral-300 shrink-0"
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
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg z-50">
                    <div className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400 truncate border-b border-neutral-100 dark:border-neutral-700">
                      {user.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900 transition rounded-b-xl"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/signin" className="flex items-center px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-neutral-700 dark:text-neutral-200 text-xs font-bold whitespace-nowrap">
                Sign In
              </Link>
            )}

          </div>
        </div>

        {/* â”€â”€ Ticker strip â€” mobile/tablet only, the lg mega-menu covers desktop â”€â”€ */}
        <div className="lg:hidden" style={{
          background: dark ? '#111111' : '#eef2ff',
          padding: '7px 0',
          overflow: 'hidden',
          borderTop: dark ? '1px solid #222222' : '1px solid #e0e7ff',
        }}>
          <div className="ticker-track">
            {doubled.map((tool, i) => (
              <Link key={i} href={tool.href} style={{
                whiteSpace: 'nowrap',
                padding: '0 24px',
                fontSize: '12px',
                color: dark ? 'rgba(255,255,255,0.7)' : '#4338ca',
                fontWeight: '500',
                borderRight: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #c7d2fe',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <ToolIcon slug={tool.href.split('/').pop()} className="w-3.5 h-3.5" /> {tool.label}
              </Link>
            ))}
          </div>
        </div>

      </header>
    </>
  );
}

