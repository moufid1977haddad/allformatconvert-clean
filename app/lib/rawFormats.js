// Camera RAW extensions Image Converter takes (P22). Kept apart from rawDecode.js so the page can test a file name
// without referencing the decoder, which is loaded only with the first RAW file.
export const RAW_EXTENSIONS = [
  // Each one checked on real files from raw.pixls.us against LibRaw's own dcraw_emu (scripts/browser-tests/p22-raw.mjs).
  'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'dng', 'orf', 'rw2', 'rwl', 'raf', 'pef', 'srw',
  '3fr', 'iiq', 'erf', 'kdc', 'dcr', 'mrw', 'mef', 'mos',
  'x3f', // accepted only to be told why it is refused (wrong colours), see decodeRaw
];
export const RAW_ACCEPT = RAW_EXTENSIONS.map((e) => '.' + e).join(',');
export const extOf = (name) => (/\.([a-z0-9]+)$/i.exec(name || '') || [])[1]?.toLowerCase() || '';
export const isRawFile = (f) => RAW_EXTENSIONS.includes(extOf(f.name));

