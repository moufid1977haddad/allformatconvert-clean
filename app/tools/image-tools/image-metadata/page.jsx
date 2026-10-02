'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatBytes } from '../../../lib/formatBytes';
import { stripMetadata } from '../../../lib/stripMetadata';
import { FileDownload } from '../../../components/FileDownload';
// The page promised "View image metadata and EXIF data" but read only the
// browser's file properties (29/09). exifr (MIT, used by metadata viewers)
// reads EXIF, GPS, IPTC, XMP and ICC from JPEG, HEIC, TIFF, PNG, WebP and AVIF.
const fmt = (v) => {
  if (v instanceof Date) return v.toISOString().replace('.000Z', 'Z');
  if (v instanceof Uint8Array || v instanceof ArrayBuffer) return `(${v.byteLength} bytes of binary data)`;
  if (Array.isArray(v)) return v.map(fmt).join(', ');
  if (v && typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

export default function ImageMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [embedded, setEmbedded] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  // P24 (03/10): remove the metadata too (imgonline has a separate EXIF remover; iLoveIMG none), without re-encoding
  const [source, setSource] = useState(null);
  const [clean, setClean] = useState(null);
  const inputRef = useRef();
  const analyze = async (e) => {
    const file = e.target.files[0];
    setSource(file || null); setClean(null);
    e.target.value = '';
    if (!file) return;
    setError('');
    setMetadata(null);
    setEmbedded(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setMetadata({ name: file.name, size: formatBytes(file.size), type: file.type || 'unknown', width: img.naturalWidth + ' px', height: img.naturalHeight + ' px', lastModified: new Date(file.lastModified).toLocaleString() });
    };
    img.onerror = () => setMetadata({ name: file.name, size: formatBytes(file.size), type: file.type || 'unknown', note: 'This browser cannot display this image; embedded metadata is still read below.' });
    img.src = url;
    // P23: an empty file made exifr throw a raw "undefined is not an object (evaluating 'this.dataView.getUint16')" (WebKit)
    if (!file.size) { setEmbedded([]); setError('This file is empty (0 bytes): it holds no picture and no metadata.'); return; }
    try {
      const exifr = (await import('exifr')).default;
      const tags = await exifr.parse(file, { tiff: true, exif: true, gps: true, iptc: true, xmp: true, icc: true, interop: true, ifd1: false, mergeOutput: false, translateValues: true, reviveValues: true });
      const groups = [];
      for (const [group, values] of Object.entries(tags || {})) {
        if (!values || typeof values !== 'object') continue;
        const rows = Object.entries(values).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, fmt(v)]);
        if (rows.length) groups.push([group.toUpperCase(), rows]);
      }
      const gps = await exifr.gps(file).catch(() => null);
      if (gps && Number.isFinite(gps.latitude)) groups.unshift(['LOCATION', [['Latitude', gps.latitude.toFixed(6)], ['Longitude', gps.longitude.toFixed(6)]]]);
      setEmbedded(groups);
    } catch (err) {
      setEmbedded([]);
      if (!/Unknown file format|invalid|not supported/i.test(err?.message || '')) setError('The embedded metadata could not be read: the file may be damaged or cut short. Its size and type are shown above.');
    }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Metadata Viewer</h1>
        <p className="text-neutral-500 text-center mb-8">View image metadata and EXIF data</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {preview ? <img src={preview} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={analyze} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {source && embedded && embedded.length > 0 && !clean && (
            <button type="button" onClick={async () => { setError(''); try { const r = await stripMetadata(source); const blob = new Blob([r.bytes], { type: source.type || 'application/octet-stream' }); setClean({ url: URL.createObjectURL(blob), name: source.name.replace(/(\.[^.]+)?$/, '-no-metadata$1'), removed: r.removed, bytes: blob.size }); } catch (e) { setError(e?.message || 'The metadata could not be removed.'); } }} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition text-white">Remove metadata</button>
          )}
          {clean && (
            <div className="space-y-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
              <p data-removed>Removed: {clean.removed.length ? clean.removed.join(', ') : 'nothing to remove'}. The picture itself is unchanged (not re-encoded); its colour profile and orientation are kept.</p>
              <FileDownload href={clean.url} name={clean.name} />
            </div>
          )}
          {metadata && <div className="space-y-2">{Object.entries(metadata).map(([k,v]) => <div key={k} className="flex justify-between bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="text-neutral-500 capitalize">{k}</span><span className="text-indigo-400 font-mono">{v}</span></div>)}</div>}
          {embedded && (embedded.length === 0
            ? <p className="text-neutral-500 text-sm text-center">No embedded metadata (EXIF, GPS, IPTC, XMP, ICC) in this file.</p>
            : embedded.map(([group, rows]) => (
              <div key={group} className="space-y-1">
                <div className="text-sm font-semibold text-neutral-600 mt-3">{group === 'LOCATION' ? 'GPS location — visible to anyone you send this file to' : group}</div>
                {rows.map(([k, v]) => <div key={group + k} className="flex justify-between gap-4 bg-neutral-50 rounded-lg border border-neutral-200 p-2 text-sm"><span className="text-neutral-500">{k}</span><span className="font-mono text-right break-all">{v}</span></div>)}
              </div>
            )))}
        </div>
      </div>
      <SeoContent
        title={"Image Metadata Viewer"}
        description={"Image Metadata Viewer shows everything stored in an image, entirely in your browser — the file is never uploaded. It can also remove that metadata from JPG, PNG and WebP files — GPS position included — without re-encoding the picture. Besides file name, size, type and pixel dimensions, it reads the embedded metadata with exifr: EXIF (camera make and model, lens, exposure, ISO, focal length, date taken, orientation), GPS location, IPTC (caption, keywords, copyright), XMP and the ICC color profile, from JPEG, HEIC, TIFF, PNG, WebP and AVIF files. A GPS location is highlighted, since anyone you send the photo to can read it."}
        howTo={[
          "Click the upload area and select an image.",
          "Read the file properties at the top.",
          "Scroll through the embedded metadata groups (EXIF, GPS, IPTC, XMP, ICC).",
          "If a GPS location is shown, remove it before sharing the photo if you don't want it known."
        ]}
        faqs={[
          { q: "Is Image Metadata Viewer free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does this tool show EXIF data like camera settings or GPS location?", a: "Yes — camera and lens, exposure, ISO, date taken, orientation and GPS coordinates are shown when the file contains them." },
          { q: "Which formats are supported?", a: "Embedded metadata is read from JPEG, HEIC/HEIF, TIFF, PNG, WebP and AVIF; basic file properties are shown for any image." },
          { q: "Can I remove metadata from my images with this tool?", a: "Yes, for JPG, PNG and WebP: click 'Remove metadata'. Camera, date, GPS position, software, comments, IPTC and XMP are removed without re-encoding the picture, so it stays pixel-for-pixel identical; the colour profile and the orientation are kept so it still looks the same. For HEIC or TIFF, convert to JPG with Image Converter first." },
          { q: "Is my image uploaded?", a: "No — the file is read entirely in your browser." }
        ]}
        tips={[
          "Screenshots and images saved by most web apps have little or no EXIF data; photos straight from a phone or camera have the most.",
          "Check for a GPS location before posting a photo publicly."
        ]}
      />
    </div>
  );
}