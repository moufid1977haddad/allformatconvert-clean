import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://allformatconvert.com";

  const tools = [
    // PDF Tools
    "pdf-merge", "pdf-split", "pdf-compress", "pdf-to-image", "pdf-to-word",
    "pdf-to-html", "pdf-protect", "pdf-watermark", "pdf-rotate", "pdf-extract-text",
    "pdf-delete-pages", "pdf-reorder-pages", "pdf-number-pages", "image-to-pdf",
    "word-to-pdf", "excel-to-pdf", "epub-to-pdf", "markdown-to-pdf", "html-to-pdf", "text-to-pdf",
    // Image Tools
    "image-compressor", "image-converter", "image-resizer", "image-cropper",
    "image-to-base64", "image-to-gif", "image-to-pdf", "image-upscaler",
    "jpg-to-png", "jpg-to-webp", "png-to-jpg", "png-to-webp", "png-to-ico",
    "webp-to-jpg", "webp-to-png", "bmp-to-png", "heic-to-jpg", "heic-to-png",
    "svg-to-png", "ico-to-png", "tiff-to-jpg", "tiff-to-png",
    "image-editor", "image-rotate", "image-flip", "grayscale-converter",
    "brightness-contrast", "image-blur", "sepia-filter", "image-inverter",
    "add-border-to-image", "round-corners", "add-text-to-image", "add-vignette",
    "add-noise", "image-pixelator", "image-comparison", "duplicate-image-finder",
    "aspect-ratio", "image-metadata", "image-generator",
    // Video Tools
    "video-converter", "video-compressor", "video-to-audio", "video-trimmer",
    "video-merger", "video-resizer", "video-rotator", "video-watermark",
    "video-filter", "video-screenshot", "video-metadata", "video-to-gif",
    "subtitle-generator", "screen-recorder", "media-player",
    // Audio Tools
    "audio-converter", "audio-compressor", "audio-trimmer", "audio-merger",
    "audio-splitter", "audio-booster", "audio-equalizer", "audio-to-text",
    "audio-waveform", "audio-metadata", "voice-recorder",
    // Text Tools
    "word-counter", "character-counter", "case-converter", "text-reverser",
    "text-sorter", "text-comparator", "text-encryptor", "text-repeater",
    "text-truncator", "whitespace-remover", "find-replace", "duplicate-remover",
    "lorem-ipsum", "text-to-list", "text-summarizer", "keyword-extractor",
    "sentiment-analyzer",
    // Developer Tools
    "json-formatter", "json-minifier", "xml-formatter", "html-formatter",
    "css-formatter", "javascript-formatter", "sql-formatter", "hash-generator",
    "base64-encoder", "url-encoder", "jwt-decoder", "regex-tester",
    "diff-viewer", "code-formatter", "code-minifier", "color-picker",
    "uuid-generator", "timestamp-converter", "cron-expression-builder",
    "json-to-csv", "json-to-xml", "json-to-yaml", "csv-to-json",
    "xml-to-json", "yaml-to-json", "toml-to-json", "env-to-json",
    // File Tools
    "zip-extractor", "zip-creator", "tar-extractor", "file-converter",
    "file-encryptor", "file-comparator", "file-splitter", "file-metadata",
    // Math Tools
    "number-base-converter", "percentage-calculator", "roman-numeral-converter",
    "fraction-calculator", "statistics-calculator", "scientific-calculator",
    // GIF Tools
    "gif-maker", "gif-compressor", "gif-to-mp4", "gif-to-png",
    "gif-to-apng", "apng-to-gif", "mp4-to-gif", "mov-to-gif",
    "avi-to-gif", "webm-to-gif",
    // AI Tools
    "background-remover", "image-upscaler", "grammar-fixer", "text-summarizer",
    "ai-chatbot", "ai-detector", "ai-paraphraser", "ai-translator",
    "ai-writer", "audio-transcriber", "data-extractor", "email-generator",
    "image-captioner", "sentiment-analyzer",
    // QR Tools
    "qr-generator", "qr-scanner", "barcode-generator",
    // Converter Tools
    "currency-converter", "unit-converter", "color-converter", "csv-to-excel",
  ];

  const categories = [
    "pdf-tools", "image-tools", "text-tools", "media-tools", "file-tools",
    "qr-barcodes-tools", "converter-tools", "developer-tools", "math-tools",
    "gif-tools", "ai-tools",
  ];

  const staticPages = [
    { url: baseUrl, priority: 1.0 },
    { url: `${baseUrl}/tools`, priority: 0.9 },
    { url: `${baseUrl}/about`, priority: 0.7 },
    { url: `${baseUrl}/contact`, priority: 0.7 },
  ];

  const categoryPages = categories.map((cat) => ({
    url: `${baseUrl}/tools/${cat}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
    lastModified: new Date(),
  }));

  const toolPages = tools.map((tool) => ({
    url: `${baseUrl}/tools/${tool}`,
    priority: 0.6,
    changeFrequency: "monthly" as const,
    lastModified: new Date(),
  }));

  return [...staticPages, ...categoryPages, ...toolPages];
}