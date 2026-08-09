import { createElement } from 'react';
import {
  Combine, Scissors, FileArchive, Lock, Unlock, RotateCw, Droplet, Image,
  FileText, FileEdit, FileSpreadsheet, Table, Presentation, MonitorPlay, Code2,
  FileType, FileCode, BookOpen, Book, Globe, Trash2, ArrowDownUp, FolderKanban, FileSearch,
  Hash, PenSquare, PenLine, ScanSearch, ClipboardList, EyeOff, Crop, GitCompare, Archive,
  Wrench, Sparkles, Languages, Minimize2, RefreshCw, Maximize2, FlipHorizontal, Squircle, Type,
  SlidersHorizontal, Frame, Columns2, Copy, Contrast, Eclipse, Droplets, Blend, Palette, Info,
  Grid3x3, Sparkle, CircleDot, Smartphone, PenTool, AppWindow,
  Layers, Film, Camera, Component, Binary, Clapperboard, Video, Wand2, Sticker, CaseSensitive,
  ArrowDownAZ, Replace, Eraser, Link2, ListChecks, Repeat, Shuffle, Calculator, Terminal, StickyNote,
  Split, Volume2, Mic, Captions, AudioWaveform, Music, PlayCircle, FolderOpen, FolderArchive,
  QrCode, ScanLine, Barcode, Coins, Ruler, Code, Braces, Table2, FileCode2, Settings2,
  Fingerprint, KeyRound, ArrowRightLeft, ArrowLeftRight, Database, Regex, Eye, Webhook, Pipette,
  Clock, RectangleHorizontal, Link, CodeXml, FileType2, Boxes, Cog, Server, AtSign, Settings,
  Timer, ShieldCheck, Percent, Divide, BarChart3, Expand, SpellCheck, MessageCircle, ShieldAlert,
  Smile, Tag, Tags, Mail, Folder, Bot, LayoutGrid, Cloud, Zap, AlignLeft, Pilcrow,
} from 'lucide-react';

// Single source of truth for every tool + category icon on the site.
// Keyed by the last URL segment (tool slug) or category slug.
// Replaces the emoji maps previously duplicated across 15 files.
export const toolIcons = {
  // PDF Tools
  'pdf-merge': Combine, 'pdf-split': Scissors, 'pdf-compress': FileArchive,
  'pdf-protect': Lock, 'pdf-unlock': Unlock, 'pdf-rotate': RotateCw, 'pdf-watermark': Droplet,
  'image-to-pdf': ArrowRightLeft, 'pdf-to-image': ArrowRightLeft, 'pdf-to-jpg': ArrowRightLeft, 'jpg-to-pdf': ArrowRightLeft,
  'word-to-pdf': FileText, 'pdf-to-word': FileEdit, 'excel-to-pdf': FileSpreadsheet,
  'pdf-to-excel': FileSpreadsheet, 'pdf-to-ppt': Presentation, 'ppt-to-pdf': MonitorPlay,
  'html-to-pdf': Code2, 'text-to-pdf': FileType, 'markdown-to-pdf': FileCode,
  'epub-to-pdf': BookOpen, 'mobi-to-pdf': Book, 'pdf-to-html': Globe,
  'pdf-delete-pages': Trash2, 'pdf-reorder-pages': ArrowDownUp, 'pdf-organize': FolderKanban,
  'pdf-extract-text': FileSearch, 'pdf-number-pages': Hash, 'pdf-editor': PenSquare,
  'pdf-sign': PenLine, 'pdf-ocr': ScanSearch, 'pdf-forms': ClipboardList, 'pdf-redact': EyeOff,
  'pdf-crop': Crop, 'pdf-compare': GitCompare, 'pdf-to-pdfa': Archive, 'pdf-repair': Wrench,
  'pdf-ai-summary': Sparkles, 'pdf-translate': Languages,

  // Image Tools
  'image-compressor': Minimize2, 'image-converter': RefreshCw, 'image-resizer': Maximize2,
  'image-cropper': Crop, 'image-rotate': RotateCw, 'image-flip': FlipHorizontal,
  'round-corners': Squircle, 'add-text-to-image': Type, 'image-editor': SlidersHorizontal,
  'add-border-to-image': Frame, 'brightness-contrast': Contrast, 'image-comparison': Columns2,
  'duplicate-image-finder': Copy, 'grayscale-converter': Eclipse, 'image-blur': Droplets,
  'image-inverter': Blend, 'sepia-filter': Palette, 'image-metadata': Info,
  'image-pixelator': Grid3x3, 'add-noise': Sparkle, 'add-vignette': CircleDot,
  'heic-to-jpg': Smartphone, 'heic-to-png': ArrowRightLeft, 'webp-to-png': ArrowRightLeft,
  'webp-to-jpg': ArrowRightLeft, 'png-to-jpg': ArrowRightLeft, 'jpg-to-png': ArrowRightLeft, 'svg-to-png': PenTool,
  'png-to-ico': AppWindow, 'jpg-to-webp': Globe, 'png-to-webp': Layers, 'gif-to-png': Film,
  'bmp-to-png': ArrowRightLeft, 'tiff-to-png': ArrowRightLeft, 'tiff-to-jpg': Camera, 'ico-to-png': Component,
  'image-to-base64': Binary,

  // GIF Tools
  'video-to-gif': ArrowRightLeft, 'mp4-to-gif': ArrowRightLeft, 'webm-to-gif': ArrowRightLeft, 'apng-to-gif': ArrowRightLeft,
  'gif-to-mp4': ArrowRightLeft, 'gif-to-apng': ArrowRightLeft, 'image-to-gif': ArrowRightLeft,
  'mov-to-gif': ArrowRightLeft, 'avi-to-gif': ArrowRightLeft, 'gif-maker': Sticker, 'gif-compressor': Minimize2,

  // Text Tools
  'word-counter': Hash, 'case-converter': CaseSensitive, 'text-reverser': FlipHorizontal,
  'duplicate-remover': Trash2, 'text-sorter': ArrowDownAZ, 'find-replace': Replace,
  'text-comparator': GitCompare, 'whitespace-remover': Eraser, 'lorem-ipsum': Pilcrow,
  'url-encoder': Link2, 'text-to-list': ListChecks, 'text-truncator': Scissors,
  'text-repeater': Repeat, 'character-counter': Ruler, 'text-encryptor': Lock,
  'ascii-art': Terminal, 'sticky-notes': StickyNote,

  // Audio Tools
  'audio-converter': RefreshCw, 'audio-trimmer': Scissors, 'audio-compressor': Minimize2,
  'audio-merger': Combine, 'audio-splitter': Split, 'audio-booster': Volume2,
  'audio-equalizer': SlidersHorizontal, 'audio-waveform': AudioWaveform, 'audio-metadata': Info,
  'voice-recorder': Mic, 'audio-to-text': Captions,

  // Video Tools
  'video-to-audio': Music, 'video-compressor': Minimize2, 'video-converter': RefreshCw,
  'video-trimmer': Scissors, 'video-screenshot': Camera, 'media-player': PlayCircle,
  'video-metadata': Info, 'video-watermark': Droplet, 'subtitle-generator': Captions,
  'screen-recorder': MonitorPlay, 'video-merger': Combine, 'video-rotator': RotateCw,
  'video-resizer': Maximize2, 'video-filter': SlidersHorizontal,

  // File Tools
  'zip-extractor': FolderOpen, 'zip-creator': FolderArchive, 'tar-extractor': Archive,
  'file-converter': RefreshCw, 'file-encryptor': Lock, 'file-metadata': Info,
  'base64-encoder': Binary, 'file-comparator': GitCompare, 'file-splitter': Split,

  // QR & Barcodes
  'qr-generator': QrCode, 'qr-scanner': ScanLine, 'barcode-generator': Barcode,

  // Converter Tools
  'currency-converter': Coins, 'unit-converter': Ruler, 'color-converter': Palette,
  'mobi-to-epub': BookOpen,

  // Developer Tools
  'xml-to-json': Code, 'json-to-xml': Braces, 'tsv-to-csv': Table2, 'csv-to-tsv': Table,
  'excel-to-json': FileSpreadsheet, 'excel-to-csv': Grid3x3, 'csv-to-excel': FileSpreadsheet,
  'toml-to-json': FileCode2, 'json-to-toml': Settings2, 'json-formatter': Braces,
  'json-minifier': Minimize2, 'uuid-generator': Fingerprint, 'hash-generator': Hash,
  'password-generator': KeyRound, 'csv-to-json': ArrowRightLeft, 'json-to-csv': ArrowLeftRight,
  'css-formatter': Layers, 'html-formatter': Code2, 'js-minifier': Minimize2,
  'javascript-formatter': Braces, 'scss-to-css': Layers, 'typescript-to-js': FileCode,
  'xml-formatter': Code, 'sql-formatter': Database, 'regex-tester': Regex,
  'markdown-previewer': Eye, 'markdown-to-html': FileCode2, 'jwt-decoder': ShieldCheck,
  'markdown-editor': FileEdit, 'api-tester': Webhook, 'number-base-converter': Binary,
  'yaml-to-json': FileCode2, 'json-to-yaml': FileCode2, 'color-picker': Pipette,
  'timestamp-converter': Clock, 'aspect-ratio': RectangleHorizontal, 'url-parser': Link,
  'html-encoder': Code, 'html-entity-decoder': CodeXml, 'unicode-converter': Type,
  'hex-to-text': Binary, 'json-to-typescript': FileType2, 'json-to-go': Boxes,
  'json-to-rust': Cog, 'json-to-python': Terminal, 'json-to-php': Server,
  'json-to-csharp': AtSign, 'csv-to-sql': Database, 'sql-to-csv': Table, 'env-to-json': Settings,
  'code-minifier': Minimize2, 'diff-viewer': GitCompare, 'code-formatter': Sparkles,
  'cron-expression-builder': Timer,

  // Math Tools
  'percentage-calculator': Percent, 'roman-numeral-converter': ArrowRightLeft,
  'scientific-calculator': Calculator, 'fraction-calculator': Divide,
  'statistics-calculator': BarChart3,

  // AI Tools
  'background-remover': Eraser, 'image-upscaler': Expand, 'grammar-fixer': SpellCheck,
  'text-summarizer': AlignLeft, 'ai-translator': Languages, 'image-generator': Wand2,
  'ai-chatbot': MessageCircle, 'ai-writer': PenLine, 'ai-detector': ShieldAlert,
  'audio-transcriber': Captions, 'sentiment-analyzer': Smile, 'image-captioner': Tag,
  'data-extractor': Database, 'ai-paraphraser': Shuffle, 'email-generator': Mail,
  'keyword-extractor': Tags,
};

export const categoryIcons = {
  'pdf-tools': FileText,
  'image-tools': Image,
  'gif-tools': Clapperboard,
  'text-tools': Type,
  'audio-tools': Music,
  'video-tools': Video,
  'file-tools': Folder,
  'qr-barcodes-tools': QrCode,
  'converter-tools': RefreshCw,
  'developer-tools': Code2,
  'math-tools': Calculator,
  'ai-tools': Bot,
};

// Fallback for any slug not (yet) mapped above.
export const DefaultToolIcon = FileText;

export function getToolIcon(slug) {
  return toolIcons[slug] || DefaultToolIcon;
}

export function getCategoryIcon(slug) {
  return categoryIcons[slug] || DefaultToolIcon;
}

// Convenience components: derive the icon straight from a tool/category href
// so listing pages don't need to duplicate the mapping in local arrays.
export function ToolIcon({ slug, className }) {
  return createElement(getToolIcon(slug), { className, 'aria-hidden': true });
}

export function CategoryIcon({ slug, className }) {
  return createElement(getCategoryIcon(slug), { className, 'aria-hidden': true });
}

// Decorative, non-tool icons reused on the homepage (badges/stats).
export const homeIcons = {
  noSignup: Zap,
  secure: ShieldCheck,
  allDevices: Smartphone,
  noInstall: Cloud,
  totalTools: Wrench,
  categories: LayoutGrid,
  languages: Languages,
  countries: Globe,
};
