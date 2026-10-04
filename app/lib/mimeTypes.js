// The type of every file extension the site offers as an output (P31, 03/10). One table, checked by
// scripts/p31/output-formats.test.mjs against every format list of the tools (audio, audio merge, PDF to images,
// barcode, image outputs): a format whose list says another type, or an extension missing here, fails the test.
// Used by FileDownload for "Save / Share" (Apple's share sheet picks the apps from the type): the file is handed
// under the type of its extension even when a tool typed its Blob loosely. The Download link itself is always
// retyped application/octet-stream (app/lib/download.js).
export const MIME_BY_EXT = {
  // documents
  pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text', rtf: 'application/rtf', epub: 'application/epub+zip',
  txt: 'text/plain', csv: 'text/csv', tsv: 'text/tab-separated-values', html: 'text/html', md: 'text/markdown',
  json: 'application/json', xml: 'application/xml', sql: 'application/sql', vtt: 'text/vtt', srt: 'application/x-subrip',
  eps: 'application/postscript', svg: 'image/svg+xml', zip: 'application/zip',
  // images
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif',
  bmp: 'image/bmp', tiff: 'image/tiff', tif: 'image/tiff', ico: 'image/x-icon',
  // audio
  mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', flac: 'audio/flac', ogg: 'audio/ogg', opus: 'audio/opus',
  m4a: 'audio/mp4', m4r: 'audio/mp4', m4b: 'audio/mp4', wma: 'audio/x-ms-wma', aiff: 'audio/aiff', ac3: 'audio/ac3',
  mp2: 'audio/mpeg', wv: 'audio/x-wavpack', caf: 'audio/x-caf', au: 'audio/basic', mka: 'audio/x-matroska', w64: 'audio/x-w64',
  // video
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mkv: 'video/x-matroska', avi: 'video/x-msvideo',
};

/** The type of `name`'s extension, or null when the site has no entry for it. */
export function mimeForName(name) {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(String(name || ''));
  return (m && MIME_BY_EXT[m[1].toLowerCase()]) || null;
}
