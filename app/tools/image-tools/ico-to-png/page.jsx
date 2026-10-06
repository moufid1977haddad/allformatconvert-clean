'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { drawToRaster, encodeRaster, resultOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { icoEntries, singleEntryIco } from '../../../lib/icoEntries';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function ICOtoPNGPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [sizes, setSizes] = useState(null); // P24 (03/10): every image of the icon, as ezgif and Convertio give
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setResult(null); setSizes(null); setError(''); } };
  const decodeBlob = (blob) => new Promise((resolve, reject) => {
    const u = URL.createObjectURL(blob); const im = new Image();
    im.onload = async () => {
      try { const out = await drawToRaster(im.naturalWidth, im.naturalHeight, (ctx, y) => ctx.drawImage(im, 0, -y)); resolve(await encodeRaster(out, 'image/png')); }
      catch (err) { reject(err); } finally { URL.revokeObjectURL(u); }
    };
    im.onerror = () => { URL.revokeObjectURL(u); reject(new Error('unreadable')); };
    im.src = u;
  });
  const extractAll = async () => {
    setError(''); setSizes(null);
    try {
      const { entries, count } = icoEntries(new Uint8Array(await file.arrayBuffer()));
      const base = (file.name || 'icon').replace(/\.[^.]+$/, '');
      const list = [];
      for (const en of entries) {
        let blob = null;
        try { blob = en.png ? new Blob([en.data], { type: 'image/png' }) : await decodeBlob(singleEntryIco(en)); } catch { blob = null; }
        list.push({ ...en, blob, url: blob ? URL.createObjectURL(blob) : null, name: `${base}-${en.width}x${en.height}${en.bitCount ? '-' + en.bitCount + 'bit' : ''}${entries.filter((x) => x.width === en.width && x.height === en.height).length > 1 ? '-' + (en.index + 1) : ''}.png` });
      }
      const bad = list.filter((x) => !x.blob).length + (count - entries.length);
      setSizes({ list: list.filter((x) => x.blob), bad, count });
    } catch (err) { setError(err.message); }
  };
  const convert = () => {
    const img = new Image();
    img.onload = async () => {
      // 30/09: a Blob named after the original (a data: link saves nothing on iPhone), any size (bands on iPhone).
      setError('');
      try {
        const out = await drawToRaster(img.naturalWidth, img.naturalHeight, (ctx, y) => ctx.drawImage(img, 0, -y));
        setResult(resultOf(await encodeRaster(out, 'image/png'), file?.name || 'image', ''));
      } catch (e) { setError(e.message); }
    };
    img.onerror = () => {
      setError('Could not load this image. The file may be corrupted or in an unsupported format.');
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ICO to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert ICO to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".ico" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
          <button type="button" onClick={extractAll} disabled={!file} className="w-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 rounded-xl py-2 font-semibold transition" data-ico-all>Every size in this icon</button>
          {sizes && (
            <div className="space-y-2" data-ico-sizes>
              <p className="text-sm text-neutral-600">{sizes.list.length} image{sizes.list.length > 1 ? 's' : ''} in this icon{sizes.bad ? ` — ${sizes.bad} could not be read and ${sizes.bad > 1 ? 'are' : 'is'} left out` : ''}. PNG images inside the icon are given as they are, byte for byte.</p>
              <DownloadGroup zipName={(file?.name || 'icon').replace(/\.[^.]+$/, '') + '-sizes.zip'}>
                <div className="space-y-2">
                  {sizes.list.map((x) => <FileDownload key={x.index} href={x.url} blob={x.blob} name={x.name} note={`${x.width} × ${x.height}${x.bitCount ? ', ' + x.bitCount + '-bit' : ''}`} />)}
                </div>
              </DownloadGroup>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="ICO to PNG"
        description={`ICO to PNG opens a Windows icon file and saves its images as PNG. An .ico file usually holds the same icon drawn at several sizes. "Convert" gives the largest one, which is the image browsers display. "Every size in this icon" lists each image inside with its width, height and bit depth, so you can download any of them as a PNG, or all of them in a ZIP named after the icon. Images already stored as PNG inside the icon are handed over byte for byte; older bitmap entries are decoded by your browser and saved as new PNG files.`}
        howToTitle="How to convert ICO to PNG"
        howTo={[
          `Pick an .ico file in the upload area; the icon is shown there.`,
          `Click "Convert" to get the largest image as a PNG, then "Download".`,
          `Or click "Every size in this icon" to see each image the icon holds.`,
          `Click "Download" next to the size you want, or "Download all" for a ZIP of every size.`
        ]}
        specs={[
          { label: 'Input format', value: `ICO (.ico), one icon at a time` },
          { label: 'Output', value: `PNG, one file per icon size, or a ZIP of them` },
          { label: 'File names', value: `Icon name, then width x height and bit depth, for example icon-32x32-32bit.png` }
        ]}
        privacy={`The icon file is read on this page: its directory is parsed by our script in your browser and each image is decoded by the browser. No copy of the icon is uploaded. An icon that cannot be read leaves a trace in our error log: the cleaned message shown, the tool's name and your browser's name and version.`}
        faqs={[
          { q: "Does \"Convert\" give the largest size?", a: `Yes. "Convert" gives the largest image in the icon, which is the one browsers show. To pick another size, such as the small taskbar version, use "Every size in this icon" and download that line.` },
          { q: "Are PNG images inside the icon re-encoded?", a: `No. Modern icons often store their large sizes as PNG; those are given exactly as they are inside the .ico. Only bitmap entries are decoded and saved as new PNG files.` },
          { q: "Are the other sizes still offered if one image is damaged?", a: `Yes. A damaged image is left out and the page says how many could not be read. When you use "Every size in this icon" on a file that is not an icon at all, the message says its header is not an icon directory.` }
        ]}
        tips={[
          `To build an icon file from a PNG instead, with the sizes you choose, use PNG to ICO.`
        ]}
      />
    </div>
  );
}