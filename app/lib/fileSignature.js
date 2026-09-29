// What a file REALLY is, from its first bytes (audit 2, 29/09, File Metadata).
// The page showed only the browser's `file.type`, which browsers derive from the file NAME's extension, while telling
// visitors to use it "to verify a file's actual MIME type when the extension has been changed": a program renamed
// photo.jpg was reported as image/jpeg. Signatures below are the published magic numbers (as `file` / libmagic and
// Gary Kessler's table list them); each lists the extensions it normally carries.

const at = (b, off, sig) => sig.every((v, i) => b[off + i] === v);
const ascii = (b, off, s) => at(b, off, [...s].map((c) => c.charCodeAt(0)));
const brand = (b) => (ascii(b, 4, 'ftyp') ? String.fromCharCode(...b.slice(8, 12)) : null);

const SIGS = [
  ['PNG image', 'image/png', ['png'], (b) => at(b, 0, [0x89, 0x50, 0x4e, 0x47])],
  ['JPEG image', 'image/jpeg', ['jpg', 'jpeg', 'jfif', 'jpe'], (b) => at(b, 0, [0xff, 0xd8, 0xff])],
  ['GIF image', 'image/gif', ['gif'], (b) => ascii(b, 0, 'GIF8')],
  ['WebP image', 'image/webp', ['webp'], (b) => ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP')],
  ['WAV audio', 'audio/wav', ['wav'], (b) => ascii(b, 0, 'RIFF') && ascii(b, 8, 'WAVE')],
  ['AVI video', 'video/x-msvideo', ['avi'], (b) => ascii(b, 0, 'RIFF') && ascii(b, 8, 'AVI ')],
  ['TIFF image', 'image/tiff', ['tif', 'tiff', 'dng', 'nef', 'cr2', 'arw'], (b) => at(b, 0, [0x49, 0x49, 0x2a, 0x00]) || at(b, 0, [0x4d, 0x4d, 0x00, 0x2a])],
  ['BMP image', 'image/bmp', ['bmp', 'dib'], (b) => ascii(b, 0, 'BM') && b.length > 14],
  ['ICO icon', 'image/x-icon', ['ico', 'cur'], (b) => at(b, 0, [0x00, 0x00, 0x01, 0x00]) || at(b, 0, [0x00, 0x00, 0x02, 0x00])],
  ['Photoshop document', 'image/vnd.adobe.photoshop', ['psd', 'psb'], (b) => ascii(b, 0, '8BPS')],
  ['HEIC/HEIF image', 'image/heic', ['heic', 'heif', 'hif'], (b) => ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].includes(brand(b))],
  ['AVIF image', 'image/avif', ['avif'], (b) => ['avif', 'avis'].includes(brand(b))],
  ['QuickTime video', 'video/quicktime', ['mov', 'qt'], (b) => brand(b) === 'qt  '],
  ['M4A/M4B audio', 'audio/mp4', ['m4a', 'm4b', 'm4p', 'm4r'], (b) => ['M4A ', 'M4B ', 'M4P '].includes(brand(b))],
  ['3GP video', 'video/3gpp', ['3gp', '3g2'], (b) => /^3g/.test(brand(b) || '')],
  ['MP4 video', 'video/mp4', ['mp4', 'm4v', 'mp4v'], (b) => brand(b) !== null],
  ['Matroska / WebM video', 'video/webm', ['mkv', 'webm', 'mka', 'mk3d'], (b) => at(b, 0, [0x1a, 0x45, 0xdf, 0xa3])],
  ['FLV video', 'video/x-flv', ['flv'], (b) => ascii(b, 0, 'FLV')],
  ['MPEG video', 'video/mpeg', ['mpg', 'mpeg', 'vob'], (b) => at(b, 0, [0x00, 0x00, 0x01, 0xba])],
  ['FLAC audio', 'audio/flac', ['flac'], (b) => ascii(b, 0, 'fLaC')],
  ['Ogg audio/video', 'audio/ogg', ['ogg', 'oga', 'ogv', 'opus', 'spx'], (b) => ascii(b, 0, 'OggS')],
  ['MP3 audio', 'audio/mpeg', ['mp3'], (b) => ascii(b, 0, 'ID3') || (b[0] === 0xff && (b[1] & 0xe6) === 0xe2)],
  ['AAC audio (ADTS)', 'audio/aac', ['aac'], (b) => b[0] === 0xff && (b[1] & 0xf6) === 0xf0],
  ['MIDI', 'audio/midi', ['mid', 'midi'], (b) => ascii(b, 0, 'MThd')],
  ['PDF document', 'application/pdf', ['pdf', 'ai'], (b) => ascii(b, 0, '%PDF')],
  ['PostScript', 'application/postscript', ['ps', 'eps'], (b) => ascii(b, 0, '%!PS')],
  ['RTF document', 'application/rtf', ['rtf'], (b) => ascii(b, 0, '{\\rtf')],
  ['Legacy Office document (DOC/XLS/PPT/MSG)', 'application/x-ole-storage', ['doc', 'xls', 'ppt', 'msg', 'msi', 'pub', 'vsd'], (b) => at(b, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
  ['ZIP archive or ZIP-based document (DOCX, XLSX, PPTX, ODT, EPUB, JAR, APK)', 'application/zip', ['zip', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'epub', 'jar', 'apk', 'xpi', 'kmz', 'cbz', '3mf', 'ipa', 'aar', 'vsix', 'nupkg', 'whl'], (b) => at(b, 0, [0x50, 0x4b, 0x03, 0x04]) || at(b, 0, [0x50, 0x4b, 0x05, 0x06])],
  ['RAR archive', 'application/vnd.rar', ['rar', 'cbr'], (b) => ascii(b, 0, 'Rar!')],
  ['7-Zip archive', 'application/x-7z-compressed', ['7z'], (b) => at(b, 0, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])],
  ['GZIP archive', 'application/gzip', ['gz', 'tgz'], (b) => at(b, 0, [0x1f, 0x8b])],
  ['BZIP2 archive', 'application/x-bzip2', ['bz2', 'tbz2'], (b) => ascii(b, 0, 'BZh')],
  ['XZ archive', 'application/x-xz', ['xz', 'txz'], (b) => at(b, 0, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])],
  ['Zstandard archive', 'application/zstd', ['zst'], (b) => at(b, 0, [0x28, 0xb5, 0x2f, 0xfd])],
  ['TAR archive', 'application/x-tar', ['tar'], (b) => ascii(b, 257, 'ustar')],
  ['Windows program or library (EXE/DLL)', 'application/vnd.microsoft.portable-executable', ['exe', 'dll', 'sys', 'scr', 'com', 'cpl', 'ocx', 'msstyles'], (b) => ascii(b, 0, 'MZ')],
  ['Linux/Unix program (ELF)', 'application/x-elf', ['', 'so', 'o', 'elf', 'bin', 'run'], (b) => at(b, 0, [0x7f, 0x45, 0x4c, 0x46])],
  ['macOS program (Mach-O)', 'application/x-mach-binary', ['', 'dylib', 'bundle'], (b) => [[0xcf, 0xfa, 0xed, 0xfe], [0xce, 0xfa, 0xed, 0xfe], [0xca, 0xfe, 0xba, 0xbe]].some((s) => at(b, 0, s))],
  ['WebAssembly module', 'application/wasm', ['wasm'], (b) => at(b, 0, [0x00, 0x61, 0x73, 0x6d])],
  ['SQLite database', 'application/vnd.sqlite3', ['sqlite', 'sqlite3', 'db'], (b) => ascii(b, 0, 'SQLite format 3')],
  ['WOFF font', 'font/woff', ['woff'], (b) => ascii(b, 0, 'wOFF')],
  ['WOFF2 font', 'font/woff2', ['woff2'], (b) => ascii(b, 0, 'wOF2')],
  ['OpenType font', 'font/otf', ['otf'], (b) => ascii(b, 0, 'OTTO')],
  ['TrueType font', 'font/ttf', ['ttf', 'ttc'], (b) => at(b, 0, [0x00, 0x01, 0x00, 0x00, 0x00]) || ascii(b, 0, 'ttcf')],
  ['Disc image (ISO 9660)', 'application/x-iso9660-image', ['iso'], (b) => ascii(b, 0x8001, 'CD001')],
];

// bytes: at least the first 0x8010 bytes when available. Returns { label, mime, exts } or null (unknown / text).
export function detectSignature(bytes) {
  for (const [label, mime, exts, test] of SIGS) if (test(bytes)) return { label, mime, exts };
  return null;
}

export const extensionOf = (name) => { const i = name.lastIndexOf('.'); return i > 0 && i < name.length - 1 ? name.slice(i + 1).toLowerCase() : ''; };
