'use client';
// P24 (03/10): page size, orientation and margin for pictures turned into PDF pages (iLovePDF: "Page size", "Page
// orientation", "Margin"; PDF24: A0-A6 / Letter, margins). "Fit to picture" keeps the former behaviour: one page the
// size of each picture. Used by lib/pdfImages.js addImagePage(pdfDoc, file, layout).
export const DEFAULT_IMAGE_LAYOUT = { size: 'fit', orientation: 'auto', marginMm: 0 };

export default function ImagePageLayout({ value, onChange, disabled }) {
  const set = (k) => (e) => onChange({ ...value, [k]: k === 'marginMm' ? Number(e.target.value) : e.target.value });
  const fit = value.size === 'fit';
  const field = 'w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm bg-white disabled:bg-neutral-100';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-neutral-600" data-page-layout>
      <label>Page size
        <select id="pl-size" value={value.size} onChange={set('size')} disabled={disabled} className={field}>
          <option value="fit">Fit to each picture</option>
          <option value="a4">A4</option>
          <option value="letter">US Letter</option>
          <option value="legal">US Legal</option>
          <option value="a5">A5</option>
        </select>
      </label>
      <label>Orientation
        <select id="pl-orientation" value={value.orientation} onChange={set('orientation')} disabled={disabled || fit} className={field}>
          <option value="auto">Automatic (follows each picture)</option>
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </label>
      <label>Margin
        <select id="pl-margin" value={value.marginMm} onChange={set('marginMm')} disabled={disabled || fit} className={field}>
          <option value={0}>None</option>
          <option value={10}>Small (10 mm)</option>
          <option value={20}>Big (20 mm)</option>
        </select>
      </label>
    </div>
  );
}
