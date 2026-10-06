// P24 (03/10): the metadata a file carries inside it, as metadata2go and exifinfo.org show it — not only what the
// browser knows (name, size, date). Read locally with the libraries the site already ships (exifr, pdf-lib, JSZip);
// each reader returns [[group, [[label, value], …]], …] and never guesses: a field that is absent is not listed.
const MAX_FULL_READ = 300 * 1024 * 1024; // PDF and ZIP readers need the whole file in memory

const clean = (v) => (v === undefined || v === null ? '' : String(v).replace(/\s+/g, ' ').trim());
const dateText = (d) => (d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString().replace('.000Z', 'Z').replace('T', ' ') : clean(d));
const rows = (pairs) => pairs.map(([k, v]) => [k, v instanceof Date ? dateText(v) : clean(v)]).filter(([, v]) => v);

const IMAGE_OPTIONS = { tiff: true, exif: true, gps: true, xmp: true, iptc: true, ifd1: false, translateValues: true, reviveValues: true };

// P37 follow-up (06/10): exifr has no WebP reader. exifr.parse threw "Unknown file format", the error was caught as
// "no metadata", and a WebP carrying a GPS position was said to hold none. Its EXIF, XMP and ICC chunks are now taken
// out by lib/webpMetadata.js (the module Image Metadata Viewer uses) and read by exifr's own parsers; the groups are
// then merged into one object, the form exifr.parse gives by default. A WebP cut short throws: readEmbedded says so.
// The file is not loaded whole: its chunk headers are walked, and only the RIFF header and the metadata chunks are
// read, so a WebP of any size is read (a chunk that runs past the end of the file is kept as a bare header, which
// webpMetadataChunks reports as a file cut short, as it would on the whole file).
const u32le = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const fourcc = (b, o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
async function webpMetadataBytes(file) {
  const read = async (from, to) => new Uint8Array(await file.slice(from, to).arrayBuffer());
  const head = await read(0, 12);
  const riffEnd = Math.min(file.size, 8 + u32le(head, 4));
  const parts = [head];
  let i = 12;
  while (i + 8 <= riffEnd) {
    const h = await read(i, i + 8);
    const len = u32le(h, 4), end = i + 8 + len;
    if (['EXIF', 'XMP ', 'ICCP'].includes(fourcc(h, 0))) parts.push(await read(i, end + (len & 1)));
    else if (end > file.size) parts.push(h);
    if (end > file.size) break;
    i = end + (len & 1);
  }
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  const size = out.length - 8; // the RIFF size of the shortened file
  out[4] = size & 0xff; out[5] = (size >>> 8) & 0xff; out[6] = (size >>> 16) & 0xff; out[7] = (size >>> 24) & 0xff;
  return out;
}

async function webpTags(file, exifrModule) {
  const { parseWebpMetadata } = await import('./webpMetadata');
  const groups = await parseWebpMetadata(exifrModule, await webpMetadataBytes(file), { ...IMAGE_OPTIONS, mergeOutput: false });
  if (!groups) return null;
  return Object.assign({}, ...Object.values(groups).filter((g) => g && typeof g === 'object' && !ArrayBuffer.isView(g)));
}

async function imageGroups(file, webp) {
  const exifrModule = await import('exifr');
  const exifr = exifrModule.default;
  const t = webp ? await webpTags(file, exifrModule) : await exifr.parse(file, IMAGE_OPTIONS).catch(() => null);
  if (!t) return [];
  const out = [];
  const camera = rows([['Camera make', t.Make], ['Camera model', t.Model], ['Lens', t.LensModel], ['Taken', t.DateTimeOriginal || t.CreateDate],
    ['Exposure', t.ExposureTime ? (t.ExposureTime < 1 ? `1/${Math.round(1 / t.ExposureTime)} s` : `${t.ExposureTime} s`) : ''], ['Aperture', t.FNumber ? `f/${t.FNumber}` : ''],
    ['ISO', t.ISO], ['Focal length', t.FocalLength ? `${t.FocalLength} mm` : ''], ['Orientation', t.Orientation]]);
  if (camera.length) out.push(['Camera (EXIF)', camera]);
  const author = rows([['Software', t.Software || t.CreatorTool], ['Artist', t.Artist || t.creator], ['Copyright', t.Copyright || t.rights], ['Description', t.ImageDescription || t.description], ['Modified', t.ModifyDate]]);
  if (author.length) out.push(['Authoring', author]);
  if (Number.isFinite(t.latitude) && Number.isFinite(t.longitude)) out.push(['Location (GPS)', [['Latitude', t.latitude.toFixed(6)], ['Longitude', t.longitude.toFixed(6)], ...(Number.isFinite(t.GPSAltitude) ? [['Altitude', `${Math.round(t.GPSAltitude)} m`]] : [])]]);
  return out;
}

async function pdfGroups(file) {
  if (file.size > MAX_FULL_READ) return [['PDF', [['Note', 'Too large to read its properties here (over 300 MB).']]]];
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder('latin1').decode(bytes.subarray(0, 16)).match(/%PDF-(\d\.\d)/);
  const { PDFDocument } = await import('pdf-lib');
  let doc;
  try { doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false }); } catch { return [['PDF', [['Note', 'The PDF structure could not be read (damaged file?).']]]]; }
  const safe = (f) => { try { return f(); } catch { return ''; } };
  return [['PDF properties', rows([['Title', safe(() => doc.getTitle())], ['Author', safe(() => doc.getAuthor())], ['Subject', safe(() => doc.getSubject())], ['Keywords', safe(() => doc.getKeywords())],
    ['Created with', safe(() => doc.getCreator())], ['Produced by', safe(() => doc.getProducer())], ['Created', safe(() => doc.getCreationDate())], ['Modified', safe(() => doc.getModificationDate())],
    ['Pages', safe(() => doc.getPageCount())], ['PDF version', header ? header[1] : ''], ['Encrypted', doc.isEncrypted ? 'yes (properties may be unreadable)' : 'no']])]];
}

const xmlText = (xml, names) => { for (const n of names) { const el = xml.getElementsByTagName(n)[0]; if (el && el.textContent.trim()) return el.textContent.trim(); } return ''; };

async function zipGroups(file) {
  if (file.size > MAX_FULL_READ) return [['Archive', [['Note', 'Too large to list here (over 300 MB).']]]];
  const JSZip = (await import('jszip')).default;
  let zip;
  try { zip = await JSZip.loadAsync(file); } catch { return [['Archive', [['Note', 'The ZIP structure could not be read (damaged, split or encrypted in a way this reader does not support).']]]]; }
  const out = [];
  const parse = async (name) => { const f = zip.file(name); if (!f) return null; try { return new DOMParser().parseFromString(await f.async('string'), 'application/xml'); } catch { return null; } };
  const core = await parse('docProps/core.xml');
  if (core) {
    const app = await parse('docProps/app.xml');
    out.push(['Office document properties', rows([['Title', xmlText(core, ['dc:title'])], ['Subject', xmlText(core, ['dc:subject'])], ['Author', xmlText(core, ['dc:creator'])],
      ['Last modified by', xmlText(core, ['cp:lastModifiedBy'])], ['Created', xmlText(core, ['dcterms:created'])], ['Modified', xmlText(core, ['dcterms:modified'])],
      ['Revision', xmlText(core, ['cp:revision'])], ['Application', app ? xmlText(app, ['Application']) : ''], ['Pages', app ? xmlText(app, ['Pages']) : ''],
      ['Words', app ? xmlText(app, ['Words']) : ''], ['Slides', app ? xmlText(app, ['Slides']) : ''], ['Company', app ? xmlText(app, ['Company']) : '']])]);
  }
  const meta = await parse('meta.xml'); // OpenDocument
  if (meta) out.push(['OpenDocument properties', rows([['Title', xmlText(meta, ['dc:title'])], ['Author', xmlText(meta, ['meta:initial-creator', 'dc:creator'])], ['Created', xmlText(meta, ['meta:creation-date'])], ['Modified', xmlText(meta, ['dc:date'])], ['Generator', xmlText(meta, ['meta:generator'])]])]);
  const files = Object.values(zip.files).filter((f) => !f.dir);
  const sizes = files.map((f) => f._data?.uncompressedSize).filter(Number.isFinite);
  out.push(['Archive contents', rows([['Files', files.length], ['Folders', Object.values(zip.files).filter((f) => f.dir).length],
    ['Total size unpacked', sizes.length === files.length ? `${sizes.reduce((a, b) => a + b, 0).toLocaleString()} bytes` : ''],
    ['First files', files.slice(0, 8).map((f) => f.name).join(', ') + (files.length > 8 ? ', …' : '')]])]);
  return out.filter(([, r]) => r.length);
}

// ID3v2.3/2.4 text frames and ID3v1, the tags an MP3 carries
async function id3Groups(file) {
  const head = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
  const out = [];
  if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) {
    const ver = head[3], size = ((head[6] & 0x7f) << 21) | ((head[7] & 0x7f) << 14) | ((head[8] & 0x7f) << 7) | (head[9] & 0x7f);
    const NAMES = { TIT2: 'Title', TPE1: 'Artist', TALB: 'Album', TPE2: 'Album artist', TYER: 'Year', TDRC: 'Date', TCON: 'Genre', TRCK: 'Track', TCOM: 'Composer', TSSE: 'Encoder settings', TENC: 'Encoded by', TCOP: 'Copyright' };
    const dec = (enc, b) => { try { return new TextDecoder(enc === 1 ? 'utf-16' : enc === 2 ? 'utf-16be' : enc === 3 ? 'utf-8' : 'latin1').decode(b).replace(/\0+$/g, '').replace(/\0/g, ' / '); } catch { return ''; } };
    const found = [];
    let p = 10;
    const end = Math.min(head.length, 10 + size);
    while (p + 10 <= end && ver >= 3) {
      const id = String.fromCharCode(...head.subarray(p, p + 4));
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const fs = ver === 4 ? ((head[p + 4] & 0x7f) << 21) | ((head[p + 5] & 0x7f) << 14) | ((head[p + 6] & 0x7f) << 7) | (head[p + 7] & 0x7f) : (head[p + 4] << 24 | head[p + 5] << 16 | head[p + 6] << 8 | head[p + 7]) >>> 0;
      if (!fs || p + 10 + fs > end) break;
      if (NAMES[id] && id.startsWith('T')) found.push([NAMES[id], dec(head[p + 10], head.subarray(p + 11, p + 10 + fs))]);
      if (id === 'APIC') found.push(['Cover picture', 'yes']);
      p += 10 + fs;
    }
    const r = rows(found);
    if (r.length) out.push([`ID3v2.${ver} tags`, r]);
  }
  if (file.size >= 128) {
    const tail = new Uint8Array(await file.slice(file.size - 128).arrayBuffer());
    if (tail[0] === 0x54 && tail[1] === 0x41 && tail[2] === 0x47) {
      const s = (a, b) => new TextDecoder('latin1').decode(tail.subarray(a, b)).replace(/\0.*$/, '').trim();
      const r = rows([['Title', s(3, 33)], ['Artist', s(33, 63)], ['Album', s(63, 93)], ['Year', s(93, 97)]]);
      if (r.length) out.push(['ID3v1 tags', r]);
    }
  }
  return out;
}

export async function readEmbedded(file, sig) {
  if (!sig || !file.size) return [];
  const label = sig.label;
  try {
    if (/JPEG|PNG|WebP|TIFF|HEIC|AVIF/.test(label)) return await imageGroups(file, /WebP/.test(label));
    if (/^PDF/.test(label)) return await pdfGroups(file);
    if (/^ZIP/.test(label)) return await zipGroups(file);
    if (/^MP3/.test(label)) return await id3Groups(file);
  } catch { return [['Embedded metadata', [['Note', 'Could not be read: the file may be damaged or cut short.']]]]; }
  return [];
}

export const EMBEDDED_KINDS = 'photos (EXIF, GPS), PDF, Word/Excel/PowerPoint and OpenDocument, ZIP and MP3 (ID3)';
