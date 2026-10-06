// P37 (06/10): read the metadata of a WebP file. exifr 7.1.3 has no WebP reader: on a WebP, exifr.parse throws
// "Unknown file format", so Image Metadata Viewer said a WebP held no metadata even when it carried a GPS position.
// A WebP is a RIFF file; its metadata sits in three chunks (Google's WebP container spec, "Extended file format"):
//   "EXIF" — a TIFF block (II*\0 or MM\0*); some writers (libvips, older ImageMagick) put "Exif\0\0" in front of it,
//   "XMP " — an XMP packet (UTF-8 text),
//   "ICCP" — an ICC colour profile.
// Each payload is handed to exifr's own parsers, so the tags, their names and translated values are the same as for a
// JPEG carrying the same data (exiftool reads the same three chunks).

const u32le = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const tag = (b, o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

export function isWebp(b) {
  return b.length >= 12 && tag(b, 0) === 'RIFF' && tag(b, 8) === 'WEBP';
}

// Returns { exif: Uint8Array (TIFF block) | null, xmp: string | null, icc: Uint8Array | null }; throws a sentence when
// a chunk runs past the end of the file.
export function webpMetadataChunks(b) {
  if (!isWebp(b)) throw new Error('This file is not a WebP image.');
  const out = { exif: null, xmp: null, icc: null };
  const riffEnd = Math.min(b.length, 8 + u32le(b, 4));
  let i = 12;
  while (i + 8 <= riffEnd) {
    const type = tag(b, i), len = u32le(b, i + 4);
    if (i + 8 + len > b.length) throw new Error('This WebP file is cut short: its metadata could not be read in full.');
    const data = b.subarray(i + 8, i + 8 + len);
    if (type === 'EXIF' && !out.exif) {
      const exifHeader = data.length >= 6 && tag(data, 0) === 'Exif' && data[4] === 0 && data[5] === 0;
      out.exif = exifHeader ? data.subarray(6) : data;
    } else if (type === 'XMP ' && out.xmp === null) {
      out.xmp = new TextDecoder('utf-8').decode(data);
    } else if (type === 'ICCP' && !out.icc) {
      out.icc = data;
    }
    i += 8 + len + (len & 1); // chunks are padded to an even length
  }
  return out;
}

// Same output shape as exifr.parse(file, options) with mergeOutput: false — { ifd0, exif, gps, interop, xmp, dc, icc… }
// — or undefined when the WebP holds no metadata. `exifr` is the module (its default export or the namespace).
export async function parseWebpMetadata(exifr, bytes, options) {
  const lib = exifr.segmentParsers ? exifr : exifr.default;
  const { exif, xmp, icc } = webpMetadataChunks(bytes);
  const out = {};
  const merge = (r) => {
    for (const [group, values] of Object.entries(r || {})) {
      if (group === 'xmlns') continue; // namespace list: exifr.parse leaves it out of its output too
      if (values && typeof values === 'object' && out[group] && typeof out[group] === 'object') Object.assign(out[group], values);
      else out[group] = values;
    }
  };
  if (exif && exif.length >= 8) merge(await lib.parse(exif, options));
  if (xmp && options.xmp !== false) merge(await lib.segmentParsers.get('xmp').parse(xmp));
  if (icc && icc.length && options.icc !== false) out.icc = await lib.segmentParsers.get('icc').parse(icc);
  return Object.keys(out).length ? out : undefined;
}
