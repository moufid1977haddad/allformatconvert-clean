'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// Audit 2 (29/09). Before: every field started empty and was written back empty, so the values already in a form were
// wiped; checkboxes, radio buttons and dropdowns were shown as text boxes whose input was silently dropped; the form
// was always flattened; a form that opens without a password but carries restrictions (common for official forms)
// was refused. Now each field shows its current value with the right control (as Sejda and Smallpdf), only fields
// the user changed are written, flattening is a choice, and such forms are decrypted first.
// instanceof, not constructor.name: class names are minified in the production build.
const kindOf = (field, lib) => ['TextField', 'CheckBox', 'RadioGroup', 'Dropdown', 'OptionList'].find((t) => field instanceof lib['PDF' + t]) || 'Other';
function readField(field, lib) {
  const kind = kindOf(field, lib);
  const f = { name: field.getName(), kind, readOnly: field.isReadOnly() };
  if (kind === 'TextField') f.value = field.getText() || '';
  if (kind === 'CheckBox') f.value = field.isChecked();
  if (kind === 'RadioGroup') { f.options = field.getOptions(); f.value = field.getSelected() || ''; }
  if (kind === 'Dropdown' || kind === 'OptionList') { f.options = field.getOptions(); const sel = field.getSelected(); f.value = kind === 'Dropdown' ? (sel[0] || '') : sel; }
  if (kind === 'Other') f.label = field instanceof lib.PDFSignature ? 'Signature' : field instanceof lib.PDFButton ? 'Button' : 'This';
  return f;
}

export default function Page() {
  const [file, setFile] = useState(null);
  const [xfa, setXfa] = useState(false);
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const [flatten, setFlatten] = useState(false);
  const [changed, setChanged] = useState({});
  const fileRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setResult(null);
    setError('');
    setChanged({});
    setFields([]);
    setXfa(false);
    setValues({});
    setLoading(true);
    try {
      const lib = await import('pdf-lib');
      const arrayBuffer = await f.arrayBuffer();
      const pdfDoc = await lib.PDFDocument.load(await openablePdfBytes(arrayBuffer));
      const fieldList = pdfDoc.getForm().getFields().map((x) => readField(x, lib));
      setFields(fieldList);
      // P24 review (03/10): an XFA form (Adobe LiveCycle) keeps its fields outside the AcroForm: "No form fields found" was wrong
      const af = pdfDoc.catalog.lookupMaybe(lib.PDFName.of('AcroForm'), lib.PDFDict);
      setXfa(!fieldList.length && !!(af && af.get(lib.PDFName.of('XFA'))));
      const vals = {};
      fieldList.forEach(x => { vals[x.name] = x.value; });
      setValues(vals);
      setChanged({});
    } catch(e) {
      setError('Could not read form fields: ' + e.message);
      setFields([]);
    setXfa(false);
      setValues({});
    }
    setLoading(false);
  };

  const fillForm = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer));
      const form = pdfDoc.getForm();
      for (const f of fields) {
        if (!changed[f.name] || f.readOnly) continue;
        const v = values[f.name];
        try {
          if (f.kind === 'TextField') form.getTextField(f.name).setText(v);
          else if (f.kind === 'CheckBox') { const c = form.getCheckBox(f.name); if (v) c.check(); else c.uncheck(); }
          else if (f.kind === 'RadioGroup') { const r = form.getRadioGroup(f.name); if (v) r.select(v); else r.clear(); }
          else if (f.kind === 'Dropdown') { const d = form.getDropdown(f.name); if (v) d.select(v); else d.clear(); }
          else if (f.kind === 'OptionList') { const o = form.getOptionList(f.name); if (v.length) o.select(v); else o.clear(); }
        } catch (err) {
          throw new Error(`the value of "${f.name}" could not be written (${err.message}).`);
        }
      }
      if (flatten) form.flatten();
      let pdfBytes;
      try { pdfBytes = await pdfDoc.save(); } catch (err) {
        throw /WinAnsi cannot encode/.test(err.message) ? new Error('a character you typed cannot be written with the form\'s standard font (only Western European letters can). ' + err.message) : err;
      }
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">PDF Forms</h1>
        <p className="text-neutral-500 text-center mb-8">Fill PDF form fields online</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="a PDF with form fields" /></p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          {fields.length > 0 && (
            <div className="space-y-3">
              {fields.map(field => {
                const set = (v) => { setValues({ ...values, [field.name]: v }); setChanged({ ...changed, [field.name]: true }); setResult(null); };
                const cls = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400';
                const v = values[field.name];
                return (
                  <div key={field.name} data-field={field.name}>
                    {field.kind === 'CheckBox' ? (
                      <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={!!v} disabled={field.readOnly} onChange={e => set(e.target.checked)} />{field.name}</label>
                    ) : (
                      <label className="block text-sm text-neutral-500 mb-1">{field.name}{field.readOnly ? ' (read-only)' : ''}</label>
                    )}
                    {field.kind === 'TextField' && <input aria-label={field.name} type="text" value={v} disabled={field.readOnly} onChange={e => set(e.target.value)} className={cls} />}
                    {(field.kind === 'RadioGroup' || field.kind === 'Dropdown') && (
                      <select aria-label={field.name} value={v} disabled={field.readOnly} onChange={e => set(e.target.value)} className={cls}>
                        <option value="">(none)</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    {field.kind === 'OptionList' && (
                      <select aria-label={field.name} multiple value={v} disabled={field.readOnly} onChange={e => set(Array.from(e.target.selectedOptions, o => o.value))} className={cls}>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    {field.kind === 'Other' && <p className="text-xs text-neutral-400">{field.label} field: kept as it is (not editable here).</p>}
                  </div>
                );
              })}
              <label className="flex items-center gap-2 text-sm text-neutral-700 pt-2"><input type="checkbox" checked={flatten} onChange={e => { setFlatten(e.target.checked); setResult(null); }} />Flatten the form (values become part of the page and can no longer be edited)</label>
            </div>
          )}
          {fields.length === 0 && file && !loading && <p className="text-neutral-500 text-sm text-center" data-no-fields>{xfa ? 'This PDF is an XFA form (made with Adobe LiveCycle / Designer): its fields are not standard PDF fields, and only Adobe Acrobat or Reader can fill them. Open it there, or ask the sender for a standard PDF form.' : 'No form fields found in this PDF.'}</p>}
          <button onClick={fillForm} disabled={!file || loading || fields.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Fill and Download PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <FileDownload href={result} name="filled_form.pdf" />}
        </div>
      </div>
      <SeoContent
        title="PDF Forms"
        description="PDF Forms reads the existing fillable fields from a PDF you upload — text fields, checkboxes, radio buttons, dropdowns and lists — shows each one with its current value, and writes back only what you change, entirely in your browser using the pdf-lib library; your file is never uploaded to a server. The form stays fillable, or can be flattened if you tick that option. It only fills in an existing form; it doesn't let you create a new form or add fields to a PDF that doesn't already have them."
        howTo={[
          "Click the upload area and select a PDF that already contains fillable form fields.",
          "Change the fields you need: type text, tick checkboxes, pick radio and dropdown options. Values already in the form are shown and kept.",
          "Tick 'Flatten the form' if the values must no longer be editable, then click 'Fill and Download PDF'.",
          "Click 'Download' next to filled_form.pdf to save the result."
        ]}
        faqs={[
          { q: "Is PDF Forms free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I create a new PDF form or add fields?", a: "No — this tool only fills in fields that already exist in the PDF you upload. It doesn't let you add text boxes, checkboxes, or other fields." },
          { q: "What happens to checkboxes, radio buttons, or dropdowns in the form?", a: "Each is shown with its own control (a checkbox, or a list of the options the form allows) and filled like a text field. Signature and push-button fields are kept as they are." },
          { q: "Will fields I leave alone be erased?", a: "No — every field shows its current value, and only the fields you change are written." },
          { q: "Can I type accents or other alphabets?", a: "Western European letters work with the standard form font. If a form uses that font and you type, for example, Cyrillic or Chinese, the tool says so instead of producing a broken file." },
          { q: "Does it work with a PDF that has no form fields?", a: "No — if the PDF has no fillable fields, you'll see \"No form fields found in this PDF.\"" }
        ]}
        tips={[
          "Leave 'Flatten the form' unticked to keep the form fillable; tick it when the values must become part of the page.",
          "Only PDFs with an existing fillable form (an AcroForm) will show anything to fill in.",
          "A field marked read-only is locked by the form's author and is left unchanged.",
          "Keep the original PDF if you flatten it, since flattening can't be undone."
        ]}
      />
    </div>
  );
}