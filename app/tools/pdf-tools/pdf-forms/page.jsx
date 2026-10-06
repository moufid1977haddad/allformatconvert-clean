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
        description={`PDF Forms opens a PDF that already contains fillable fields (an AcroForm) and shows every field with its current value: text boxes, checkboxes, radio groups, drop-down and multiple-choice lists. Only the fields you change are written back, so values already in the form stay as they were. Read-only fields, signatures and push buttons are left alone unless you flatten the form, which turns every field into page content. You can keep the form fillable or flatten it so the values become part of the page. It does not create new fields, and XFA forms made with Adobe LiveCycle cannot be filled here. pdf-lib reads and fills the fields inside your browser.`}
        howToTitle="How to fill a PDF form online"
        howTo={[
          `Choose a PDF that has fillable fields; each field appears with its name and current value.`,
          `Type in text fields, tick checkboxes and pick radio or list options; fields you do not touch keep their values.`,
          `Tick "Flatten the form" if the values must no longer be editable.`,
          `Click "Fill and Download PDF" to build the file, then "Download" to save filled_form.pdf.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF with AcroForm fields` },
          { label: 'Field types', value: `Text, checkbox, radio group, drop-down list, multiple-choice list` },
          { label: 'Left unchanged', value: `Signature fields, push buttons and read-only fields, unless you flatten the form` },
          { label: 'Characters', value: `Western European letters with the form's standard font` },
          { label: 'Result', value: `filled_form.pdf, still fillable or flattened` },
        ]}
        privacy={`The form is read and filled in your browser with pdf-lib; the PDF and the values you type are not sent to our servers. A form that opens without a password but restricts editing, as many official forms do, is decrypted in the browser before filling.`}
        faqs={[
          { q: "Can it fill a scan or a PDF whose boxes are only drawn?", a: `No. Those have no AcroForm fields, so the page says no form fields were found. If the file is an XFA form made with Adobe LiveCycle or Designer, the page says so instead, since only Adobe Acrobat or Reader can fill those.` },
          { q: "Will the values already in the form be kept?", a: `Yes. Each field opens with its current value, and only the fields you change are written when you save. A field marked read-only by the form's author is shown but cannot be changed here.` },
          { q: "Can I type Cyrillic, Greek or Chinese into a field?", a: `No, not with the standard PDF form font, which writes Western European letters only. In that case saving stops with a message explaining which character could not be written, instead of producing a broken file.` },
          { q: "Should I flatten the form?", a: `Yes, but only when the values must stay as they are. Flattening turns every field into part of the page, so nobody can edit it in a PDF reader, and it cannot be undone. Leave it unticked to send a form the next person can still change.` },
        ]}
        tips={[
          `To sign the completed form, open filled_form.pdf in PDF Sign after filling it.`,
        ]}
      />
    </div>
  );
}