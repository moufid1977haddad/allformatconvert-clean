// Detects a file's real format from its header bytes, independent of its
// filename/extension -- the only reliable signal once a visitor's file
// carries the wrong extension (renamed by hand, or produced by software
// that mislabels its own output -- see docs/audit/RAPPORT-tiff-paint.md).
// Used two ways: (1) to decide HOW to decode a file before any decode is
// attempted (Image Converter routes by real content, not by filename), and
// (2) when a "convert FROM <format>" tool's input turns out not to be that
// format at all, to tell the visitor what it actually is instead of
// surfacing a raw decoder crash.
//
// Deliberately narrow: only signatures this site's own tools care about
// (formats some "convert from X" tool here accepts, plus a handful of
// common non-image containers so a wildly wrong upload -- a PDF dropped on
// an image tool -- gets named instead of just "unrecognized"). This is not
// a general-purpose file-type sniffer.

function bytesMatch(bytes, offset, signature) {
  if (bytes.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}

// ISO base media file format (HEIC/HEIF/AVIF/MP4/MOV all share this
// container): bytes 4-7 are the literal string "ftyp", bytes 8-11 are the
// 4-character brand that identifies which of those it actually is.
function isoBmffBrand(bytes) {
  if (!bytesMatch(bytes, 4, [0x66, 0x74, 0x79, 0x70])) return null;
  if (bytes.length < 12) return null;
  return String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).replace(/\0+$/, '');
}

const HEIC_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1']);
const AVIF_BRANDS = new Set(['avif', 'avis']);

// Ordered; first match wins. `format` uses this site's own tool-slug
// spelling ('jpg' not 'jpeg') so it can be compared directly against
// filename extensions and used to build tool-slug strings elsewhere.
const SIGNATURES = [
  { format: 'png', label: 'PNG', test: (b) => bytesMatch(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { format: 'jpg', label: 'JPEG', test: (b) => bytesMatch(b, 0, [0xff, 0xd8, 0xff]) },
  { format: 'gif', label: 'GIF', test: (b) => bytesMatch(b, 0, [0x47, 0x49, 0x46, 0x38]) },
  { format: 'tiff', label: 'TIFF', test: (b) => bytesMatch(b, 0, [0x49, 0x49, 0x2a, 0x00]) || bytesMatch(b, 0, [0x4d, 0x4d, 0x00, 0x2a]) },
  { format: 'bmp', label: 'BMP', test: (b) => bytesMatch(b, 0, [0x42, 0x4d]) },
  { format: 'webp', label: 'WebP', test: (b) => bytesMatch(b, 0, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(b, 8, [0x57, 0x45, 0x42, 0x50]) },
  { format: 'ico', label: 'ICO', test: (b) => bytesMatch(b, 0, [0x00, 0x00, 0x01, 0x00]) },
  { format: 'heic', label: 'HEIC/HEIF', test: (b) => HEIC_BRANDS.has(isoBmffBrand(b)) },
  { format: 'avif', label: 'AVIF', test: (b) => AVIF_BRANDS.has(isoBmffBrand(b)) },
  { format: 'pdf', label: 'PDF', test: (b) => bytesMatch(b, 0, [0x25, 0x50, 0x44, 0x46]) },
  { format: 'zip', label: 'a ZIP-based document (e.g. DOCX, XLSX, EPUB)', test: (b) => bytesMatch(b, 0, [0x50, 0x4b, 0x03, 0x04]) },
  { format: 'gzip', label: 'GZIP', test: (b) => bytesMatch(b, 0, [0x1f, 0x8b]) },
];

// bytes: Uint8Array | ArrayBuffer, ideally the file's first 32+ bytes.
// Returns {format, label} for a recognized signature, or null.
export function sniffFormat(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const sig of SIGNATURES) {
    if (sig.test(b)) return { format: sig.format, label: sig.label };
  }
  return null;
}

// Formats the browser's native createImageBitmap() can decode directly.
// Image Converter uses this to route a file by its real content rather
// than its filename -- so a PNG saved with a wrong or generic extension
// still converts correctly instead of being force-fed to the TIFF decoder.
export const NATIVE_BITMAP_FORMATS = new Set(['png', 'jpg', 'gif', 'bmp', 'webp', 'ico', 'avif']);

// Display names for this site's own image-tool slugs, for building
// mismatch messages ("Use PNG to JPG instead").
export const TOOL_LABEL_BY_SLUG = {
  'png-to-jpg': 'PNG to JPG',
  'png-to-webp': 'PNG to WebP',
  'png-to-ico': 'PNG to ICO',
  'jpg-to-png': 'JPG to PNG',
  'jpg-to-webp': 'JPG to WebP',
  'gif-to-png': 'GIF to PNG',
  'bmp-to-png': 'BMP to PNG',
  'webp-to-jpg': 'WebP to JPG',
  'webp-to-png': 'WebP to PNG',
  'ico-to-png': 'ICO to PNG',
  'heic-to-jpg': 'HEIC to JPG',
  'heic-to-png': 'HEIC to PNG',
  'image-converter': 'Image Converter',
};

// Dedicated "X to Y" tools that exist on this site today. Deliberately a
// plain lookup, not derived from the filesystem -- callers fall back to
// Image Converter (which accepts every NATIVE_BITMAP_FORMATS format) for
// any pair with no dedicated tool, so an out-of-date entry here only ever
// makes a suggestion less specific, never wrong.
const DEDICATED_TOOLS = {
  png: { jpg: 'png-to-jpg', webp: 'png-to-webp', ico: 'png-to-ico' },
  jpg: { png: 'jpg-to-png', webp: 'jpg-to-webp' },
  gif: { png: 'gif-to-png' },
  bmp: { png: 'bmp-to-png' },
  webp: { jpg: 'webp-to-jpg', png: 'webp-to-png' },
  ico: { png: 'ico-to-png' },
  heic: { jpg: 'heic-to-jpg', png: 'heic-to-png' },
};

export function suggestToolSlug(detectedFormat, outputFormat) {
  return DEDICATED_TOOLS[detectedFormat]?.[outputFormat] || null;
}

// Builds what to tell a visitor when a "convert FROM <expectedFormat> TO
// <outputFormat>" tool's uploaded file turns out, per its header bytes,
// not to actually be <expectedFormat>. Returns null when there's nothing
// more specific to say than a generic decode failure (signature truly
// unrecognized, or it did match -- not actually a mismatch).
// { text: string, link: {path, label} | null } | null
export function describeFormatMismatch({ detected, expectedFormat, expectedLabel, outputFormat }) {
  if (!detected || detected.format === expectedFormat) return null;

  if (detected.format === outputFormat) {
    return { text: `This isn't actually a ${expectedLabel} file — it's already ${detected.label}. No conversion needed.`, link: null };
  }

  const slug = suggestToolSlug(detected.format, outputFormat);
  if (slug) {
    return {
      text: `This isn't actually a ${expectedLabel} file — its data is ${detected.label}.`,
      link: { path: `/tools/image-tools/${slug}`, label: `Use ${TOOL_LABEL_BY_SLUG[slug]} instead` },
    };
  }

  if (NATIVE_BITMAP_FORMATS.has(detected.format)) {
    return {
      text: `This isn't actually a ${expectedLabel} file — its data is ${detected.label}.`,
      link: { path: '/tools/image-tools/image-converter', label: 'Try Image Converter instead' },
    };
  }

  return {
    text: `This isn't actually a ${expectedLabel} file — its data looks like ${detected.label}, which this tool can't convert.`,
    link: null,
  };
}
