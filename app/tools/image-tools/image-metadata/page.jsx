'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatBytes } from '../../../lib/formatBytes';
import { stripMetadata } from '../../../lib/stripMetadata';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
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
  const [error, setError] = useToolError('');
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
            {preview ? <img alt="Preview of your image" src={preview} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
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
            ? <p className="text-neutral-500 text-sm text-center">No embedded metadata (EXIF, GPS, IPTC, XMP, ICC) found in this file. The metadata of WebP files is not read here.</p>
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
        description={"Image Metadata Viewer shows what a picture carries besides its pixels: camera and lens, exposure, ISO, date taken, orientation, GPS position, IPTC caption and copyright, XMP and the ICC color profile. It reads JPEG, HEIC/HEIF, TIFF, PNG and AVIF files with the exifr library; WebP metadata is not read, so a WebP is shown as having none. It gives the name, size and type of any image, plus the pixel size and last-modified date when the browser can display it. A GPS position is listed first. For JPG and PNG, Remove metadata makes a copy without that data and with the same pixels."}
        howToTitle={"How to view and remove photo metadata"}
        howTo={[
          "Click the upload box and choose a photo; reading starts at once.",
          "Read the file properties, then the groups of embedded data; a GPS position comes first, flagged as visible to anyone you send the file to.",
          "To strip the data, click \"Remove metadata\" (shown only when the file has embedded metadata).",
          "Click \"Download\" to save the copy, named with \"-no-metadata\" added before the extension.",
        ]}
        specs={[
          { label: "Metadata read from", value: "JPEG, HEIC/HEIF, TIFF, PNG and AVIF: EXIF, GPS, IPTC, XMP, ICC" },
          { label: "WebP files", value: "Their metadata is not read: the page says the file has none, even if it holds camera or GPS data" },
          { label: "Removal", value: "JPG and PNG; EXIF, GPS, XMP, IPTC and comments go, the color profile and orientation stay" },
          { label: "Not shown", value: "The embedded thumbnail (IFD1) and its tags" },
          { label: "Basic properties", value: "Name, size and type of any image; width, height and last-modified date when the browser can display it" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The exifr library reads the file inside this page, and the cleaned copy is assembled from its bytes in the same tab; no part of the photo, its GPS position or its metadata is sent to a server. Any error message on screen is sent to us in cleaned form, labelled with this tool and with your browser and its version; the photo and its metadata never are."}
        faqs={[
          { q: "Does it show where a photo was taken?", a: "Yes, when the file contains GPS coordinates. Latitude and longitude are shown first, to six decimals, under a heading warning that anyone you send the file to can read them." },
          { q: "Does removing metadata change the picture?", a: "No. The image data is copied byte for byte, not re-encoded, so the picture stays pixel-for-pixel identical. The color profile and the orientation are kept on purpose, so it looks the same and stays upright; camera, date, GPS, XMP, IPTC and comments are removed." },
          { q: "Can it remove metadata from HEIC, TIFF or WebP?", a: "No. Removal works on JPG and PNG only. A HEIC or TIFF file is refused with a message, and a WebP never shows the \"Remove metadata\" button, because its metadata is not read here. Convert the photo to JPG with Image Converter first." },
          { q: "Is the last-modified date the day I took the photo?", a: "No, not necessarily. The last-modified line in the file properties is the date the file was last saved on your device. The moment of the shot is the DateTimeOriginal entry in the EXIF group, when the camera recorded one." },
        ]}
        tips={[
          "Before posting a photo publicly, look for the GPS group and click \"Remove metadata\" if it is there.",
        ]}
      />
    </div>
  );
}