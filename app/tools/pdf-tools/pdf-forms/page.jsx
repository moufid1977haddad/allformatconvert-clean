'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function Page() {
  const [file, setFile] = useState(null);
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
    setLoading(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await f.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();
      const fieldList = form.getFields().map(field => ({ name: field.getName(), type: field.constructor.name }));
      setFields(fieldList);
      const vals = {};
      fieldList.forEach(f => vals[f.name] = '');
      setValues(vals);
    } catch(e) { setError('Could not read form fields: ' + e.message); }
    setLoading(false);
  };

  const fillForm = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();
      for (const [name, value] of Object.entries(values)) {
        try {
          const field = form.getTextField(name);
          field.setText(value);
        } catch(e) {}
      }
      form.flatten();
      const pdfBytes = await pdfDoc.save();
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
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF with form fields</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          {fields.length > 0 && (
            <div className="space-y-3">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm text-neutral-500 mb-1">{field.name}</label>
                  <input type="text" value={values[field.name] || ''} onChange={e => setValues({...values, [field.name]: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              ))}
            </div>
          )}
          {fields.length === 0 && file && !loading && <p className="text-neutral-400 text-sm text-center">No form fields found in this PDF.</p>}
          <button onClick={fillForm} disabled={!file || loading || fields.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Fill and Download PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="filled_form.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Filled PDF</a>}
        </div>
      </div>
      <SeoContent
        title="PDF Forms"
        description="PDF Forms reads the existing fillable fields from a PDF you upload and lets you type a value into each one, entirely in your browser using the pdf-lib library — your file is never uploaded to a server. It only fills in an existing form; it doesn't let you create a new form or add fields, checkboxes, radio buttons, or dropdowns to a PDF that doesn't already have them."
        howTo={[
          "Click the upload area and select a PDF that already contains fillable form fields.",
          "Type a value into each detected field.",
          "Click 'Fill and Download PDF' to write in your values and flatten the form.",
          "The filled, flattened PDF downloads automatically."
        ]}
        faqs={[
          { q: "Is PDF Forms free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I create a new PDF form or add fields?", a: "No — this tool only fills in fields that already exist in the PDF you upload. It doesn't let you add text boxes, checkboxes, or other fields." },
          { q: "What happens to checkboxes, radio buttons, or dropdowns in the form?", a: "Their names are detected, but this tool only writes values into text fields, so other field types won't be filled in from this page." },
          { q: "Does it work with a PDF that has no form fields?", a: "No — if the PDF has no fillable fields, you'll see \"No form fields found in this PDF.\"" }
        ]}
        tips={[
          "After filling, the form is flattened, so your values become part of the page content and can't be edited again as form fields.",
          "Only PDFs with an existing fillable form (an AcroForm) will show anything to fill in.",
          "If a field doesn't appear editable, it's likely a checkbox, radio button, or dropdown rather than a text field.",
          "Keep the original PDF if you might need to fill it again with different values, since flattening can't be undone."
        ]}
      />
    </div>
  );
}