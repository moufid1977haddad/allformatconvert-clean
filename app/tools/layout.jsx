'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const toolIcons = {
  // PDF
  'pdf-merge': '📄', 'pdf-split': '✂️', 'pdf-compress': '🗜️', 'pdf-to-word': '📝',
  'pdf-to-excel': '📊', 'pdf-to-jpg': '🖼️', 'pdf-to-image': '🗃️', 'pdf-to-html': '🌐',
  'pdf-to-ppt': '📊', 'pdf-to-pdfa': '📄', 'word-to-pdf': '📝', 'jpg-to-pdf': '🖼️',
  'image-to-pdf': '🖼️', 'excel-to-pdf': '📊', 'ppt-to-pdf': '📊', 'html-to-pdf': '🌐',
  'epub-to-pdf': '📚', 'mobi-to-pdf': '📚', 'markdown-to-pdf': '📝', 'text-to-pdf': '📝',
  'pdf-sign': '✍️', 'pdf-editor': '✏️', 'pdf-ocr': '🔍', 'pdf-forms': '📋',
  'pdf-protect': '🔒', 'pdf-unlock': '🔓', 'pdf-watermark': '💧', 'pdf-rotate': '🔄',
  'pdf-crop': '✂️', 'pdf-repair': '🔧', 'pdf-compare': '🔍', 'pdf-redact': '🖊️',
  'pdf-translate': '🌍', 'pdf-organize': '📂', 'pdf-reorder-pages': '🔀',
  'pdf-delete-pages': '🗑️', 'pdf-number-pages': '🔢', 'pdf-extract-text': '📋',
  'pdf-ai-summary': '🤖',
  // Image
  'image-compressor': '🗜️', 'image-converter': '🖼️', 'image-resizer': '📐',
  'image-cropper': '✂️', 'image-editor': '✏️', 'image-flip': '🔄', 'image-rotate': '🔄',
  'image-blur': '🌫️', 'image-inverter': '🔃', 'image-pixelator': '🔲',
  'image-comparison': '🔍', 'image-metadata': '📋', 'image-to-base64': '💻',
  'add-border-to-image': '🖼️', 'add-text-to-image': '✍️', 'add-noise': '🌫️',
  'add-vignette': '🎨', 'brightness-contrast': '☀️', 'grayscale-converter': '⬛',
  'sepia-filter': '🟤', 'round-corners': '🔲', 'duplicate-image-finder': '🔍',
  'jpg-to-png': '🖼️', 'jpg-to-webp': '🖼️', 'png-to-jpg': '🖼️', 'png-to-webp': '🖼️',
  'png-to-ico': '🖼️', 'webp-to-jpg': '🖼️', 'webp-to-png': '🖼️', 'bmp-to-png': '🖼️',
  'svg-to-png': '🖼️', 'heic-to-jpg': '🖼️', 'heic-to-png': '🖼️', 'ico-to-png': '🖼️',
  'tiff-to-jpg': '🖼️', 'tiff-to-png': '🖼️', 'gif-to-png': '🖼️',
  // GIF
  'apng-to-gif': '🎞️', 'avi-to-gif': '🎞️', 'gif-to-apng': '🎞️', 'gif-to-mp4': '🎬',
  'image-to-gif': '🎞️', 'mov-to-gif': '🎞️', 'mp4-to-gif': '🎞️', 'video-to-gif': '🎞️',
  'webm-to-gif': '🎞️',
  // Audio
  'audio-converter': '🎵', 'audio-compressor': '🗜️', 'audio-trimmer': '✂️',
  'audio-merger': '🔗', 'audio-splitter': '✂️', 'audio-booster': '🔊',
  'audio-equalizer': '🎚️', 'audio-metadata': '📋', 'audio-waveform': '〰️',
  'audio-to-text': '📝', 'voice-recorder': '🎙️',
  // Media
  'video-converter': '🎬', 'video-compressor': '🗜️', 'video-trimmer': '✂️',
  'video-merger': '🔗', 'video-resizer': '📐', 'video-rotator': '🔄',
  'video-filter': '🎨', 'video-watermark': '💧', 'video-metadata': '📋',
  'video-screenshot': '📸', 'video-to-audio': '🎵', 'gif-maker': '🎞️',
  'gif-compressor': '🗜️', 'media-player': '▶️', 'screen-recorder': '📹',
  'subtitle-generator': '💬',
  // Text
  'word-counter': '📝', 'character-counter': '🔢', 'case-converter': '🔤',
  'text-reverser': '🔃', 'text-sorter': '🔀', 'text-comparator': '🔍',
  'text-repeater': '🔁', 'text-truncator': '✂️', 'text-encryptor': '🔒',
  'text-to-list': '📋', 'find-replace': '🔍', 'duplicate-remover': '🗑️',
  'whitespace-remover': '🧹', 'lorem-ipsum': '📄', 'ascii-art': '🎨',
  'sticky-notes': '📌', 'url-encoder': '🔗',
  // File
  'zip-creator': '📦', 'zip-extractor': '📦', 'tar-extractor': '📦',
  'file-converter': '🔄', 'file-comparator': '🔍', 'file-encryptor': '🔒',
  'file-metadata': '📋', 'file-splitter': '✂️', 'base64-encoder': '💻',
  // AI
  'ai-chatbot': '🤖', 'ai-translator': '🌍', 'ai-writer': '✍️', 'ai-detector': '🔍',
  'ai-paraphraser': '📝', 'grammar-fixer': '✨', 'text-summarizer': '📋',
  'background-remover': '🎨', 'image-upscaler': '🔍', 'image-generator': '🎨',
  'image-captioner': '💬', 'audio-transcriber': '🎙️', 'email-generator': '📧',
  'keyword-extractor': '🔑', 'sentiment-analyzer': '💭', 'data-extractor': '📊',
  // Developer
  'json-formatter': '📋', 'json-minifier': '🗜️', 'xml-formatter': '📋',
  'xml-to-json': '🔄', 'yaml-to-json': '🔄', 'toml-to-json': '🔄',
  'csv-to-json': '🔄', 'csv-to-excel': '📊', 'csv-to-sql': '🗄️', 'csv-to-tsv': '🔄',
  'excel-to-csv': '🔄', 'excel-to-json': '🔄', 'sql-to-csv': '🔄', 'tsv-to-csv': '🔄',
  'json-to-csv': '🔄', 'json-to-xml': '🔄', 'json-to-yaml': '🔄', 'json-to-toml': '🔄',
  'json-to-typescript': '💻', 'json-to-python': '🐍', 'json-to-go': '🐹',
  'json-to-php': '🐘', 'json-to-csharp': '💻', 'json-to-rust': '🦀',
  'html-formatter': '🌐', 'html-encoder': '🔤', 'html-entity-decoder': '🔤',
  'css-formatter': '🎨', 'scss-to-css': '🎨', 'javascript-formatter': '💻',
  'js-minifier': '🗜️', 'typescript-to-js': '💻', 'sql-formatter': '🗄️',
  'markdown-editor': '📝', 'markdown-previewer': '👁️', 'markdown-to-html': '🌐',
  'hash-generator': '🔐', 'uuid-generator': '🆔', 'password-generator': '🔑',
  'jwt-decoder': '🔓', 'regex-tester': '🔍', 'diff-viewer': '🔍',
  'code-formatter': '💻', 'code-minifier': '🗜️', 'color-picker': '🎨',
  'aspect-ratio': '📐', 'timestamp-converter': '⏰', 'cron-expression': '⏱️',
  'cron-expression-builder': '⏱️', 'hex-to-text': '🔤', 'unicode-converter': '🔤',
  'number-base-converter': '🔢', 'env-to-json': '🔄', 'api-tester': '🔌',
  'url-parser': '🔗',
  // Converter
  'color-converter': '🎨', 'currency-converter': '💱', 'unit-converter': '📏',
  'mobi-to-epub': '📚',
  // Math
  'scientific-calculator': '🧮', 'percentage-calculator': '💯',
  'fraction-calculator': '➗', 'statistics-calculator': '📊',
  'roman-numeral-converter': '🔢',
  // QR
  'qr-generator': '📱', 'qr-scanner': '📷', 'barcode-generator': '📊',
};

export default function ToolLayout({ children }) {
  const pathname = usePathname();
  const slug = pathname.split('/').pop();
  const icon = toolIcons[slug];

  useEffect(() => {
    if (!icon) return;
    const h1 = document.querySelector('h1');
    if (!h1) return;
    const text = h1.textContent || '';
    // Only add icon if not already there
    const emojis = /\p{Emoji}/u;
    if (!emojis.test(text.charAt(0))) {
      h1.innerHTML = `<span style="margin-right:8px">${icon}</span>${h1.innerHTML}`;
    }
  }, [pathname, icon]);

  return <>{children}</>;
}
