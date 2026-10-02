'use client';
// P24 (03/10): page size, orientation and margins for the tools printed by our Chromium (HTML to PDF, Markdown to PDF),
// as iLovePDF's HTML to PDF offers them (A3/A4/A5/Letter, portrait/landscape, no / small / big margins; read 02/10).
// The choice becomes a CSS @page rule placed last in the document; /api/convert-html-to-pdf asks Gotenberg to prefer
// the CSS page size (preferCssPageSize).
import { PAGE_SETUP_DEFAULT, SIZES, MARGINS, pageSetupCss, withPageSetup } from '../lib/pageSetup';
export { PAGE_SETUP_DEFAULT, pageSetupCss, withPageSetup };

export default function PageSetup({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: k === 'landscape' ? e.target.value === 'landscape' : e.target.value });
  const box = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
      <label className="block"><span className="block text-neutral-500 mb-1">Page size</span>
        <select id="ps-size" value={value.size} onChange={set('size')} className={box}>{SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label className="block"><span className="block text-neutral-500 mb-1">Orientation</span>
        <select id="ps-orient" value={value.landscape ? 'landscape' : 'portrait'} onChange={set('landscape')} className={box}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
      <label className="block"><span className="block text-neutral-500 mb-1">Margins</span>
        <select id="ps-margin" value={value.margin} onChange={set('margin')} className={box}>{MARGINS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
    </div>
  );
}
