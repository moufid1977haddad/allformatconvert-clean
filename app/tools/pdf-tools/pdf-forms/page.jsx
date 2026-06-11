'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Forms</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Forms is a free online tool that allows you to create, edit, and fill out PDF forms without any software installation required. Simplify your document workflow and manage form submissions effortlessly with our user-friendly platform.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Forms</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your PDF document or start with a blank template to begin creating your form</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Add form fields such as text boxes, checkboxes, radio buttons, and dropdown menus to your PDF</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize the appearance of your form by adjusting colors, fonts, and field properties</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your completed PDF form or share it online for others to fill out</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Forms really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Forms is completely free to use with no hidden charges or premium subscriptions required for basic functionality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use PDF Forms on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Forms is accessible on all devices including smartphones and tablets through any modern web browser.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does PDF Forms support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Forms primarily works with PDF files, and you can export your forms in PDF format for easy distribution and sharing.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using PDF Forms?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Forms uses encryption and secure servers to protect your documents and ensure your data remains private.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use clear and descriptive labels for your form fields to help users understand what information is needed</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Organize your form fields logically in a top-to-bottom flow to improve the user experience</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Set required fields for critical information to ensure you collect all necessary data from respondents</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your form thoroughly by filling it out yourself before sharing it with others to catch any errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}