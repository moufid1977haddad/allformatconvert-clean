'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';
import { loadPdfjs } from '../../../lib/pdfjs';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { convertOffice, officeStageLabel } from '../../../lib/officeUpload';
import { GOOGLE_DOC_LANGUAGE_CODES } from '../../../lib/translateLanguages';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';
import { withActualTextUnicode } from '../../../lib/pdfActualText';

// P25 (03/10, E3): the WHOLE document, layout kept (Google Cloud Translation), offered only when the server says the
// service is configured (GET /api/pdf-translate-document): no promise on the page before it works.
let languageNames = null;
try { languageNames = new Intl.DisplayNames(['en'], { type: 'language' }); } catch { /* codes only */ }
const docLanguages = GOOGLE_DOC_LANGUAGE_CODES
  .map((code) => ({ code, name: (languageNames && languageNames.of(code === 'mni-Mtei' ? 'mni' : code)) || code }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

const languages = ['English', 'French', 'Spanish', 'German', 'Arabic', 'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Russian'];
const MAX_PDF_TRANSLATE_PAGES = 5;
const MAX_PDF_TRANSLATE_CHARS = 3000;

export default function Page() {
  const [file, setFile] = useState(null);
  const [targetLang, setTargetLang] = useState('French');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const fileRef = useRef();
  const [docMode, setDocMode] = useState(null); // null until the server answers; then { available, maxPages }
  const [mode, setMode] = useState('text');
  const [docTarget, setDocTarget] = useState('fr');
  const [stage, setStage] = useState(null);
  const [translated, offer, clearTranslated] = useDownloadable();
  useEffect(() => {
    let alive = true;
    fetch('/api/pdf-translate-document').then((r) => r.json()).then((j) => { if (alive && j && j.available) { setDocMode(j); setMode('document'); } }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const translateDocument = async () => {
    if (!file) return;
    setLoading(true); setError(''); clearTranslated(); setStage(null);
    try {
      const result = await convertOffice({ file, endpoint: '/api/pdf-translate-document', fields: { target: docTarget }, onStage: setStage, alwaysStage: true });
      offer(result.blob, `${(file.name.replace(/\.[^.]+$/, '') || 'document')}-${docTarget}.pdf`);
    } catch (e) {
      setError(e.message || 'The translation failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setOutput(''); };

  const translate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: await withActualTextUnicode(arrayBuffer) }).promise;
      let text = '';
      for (let i = 1; i <= Math.min(pdf.numPages, MAX_PDF_TRANSLATE_PAGES); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      const lengthCheck = checkPromptLength(text.slice(0, MAX_PDF_TRANSLATE_CHARS));
      if (!lengthCheck.ok) { setError(lengthCheck.message); setLoading(false); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text.slice(0, MAX_PDF_TRANSLATE_CHARS),
          tool: 'pdf-translate',
          options: { targetLang },
        }),
      });
      const data = await response.json();
      if (data.text) setOutput(data.text);
      else setError(data.error || 'Translation failed');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Translate PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Translate the text of a PDF into another language</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="a PDF file" /></p>}
          </div>
          {docMode && (
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="What to translate">
              {[['document', 'Whole PDF (layout kept)'], ['text', 'Text only']].map(([v, label]) => (
                <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => { setMode(v); setError(''); setOutput(''); clearTranslated(); }} className={`rounded-lg border p-2 text-sm font-semibold ${mode === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-neutral-50 border-neutral-200'}`}>{label}</button>
              ))}
            </div>
          )}
          {mode === 'document' && docMode ? (
            <p className="text-neutral-500 text-xs text-center -mt-2">The whole PDF, up to {docMode.maxPages} pages, translated into a new PDF with the same layout, images and tables — into any of {docLanguages.length} languages. Free: {docMode.pagesPerDay} pages a day.</p>
          ) : (
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {MAX_PDF_TRANSLATE_PAGES} pages / {MAX_PDF_TRANSLATE_CHARS.toLocaleString()} characters translated — a hard cap to keep translation cost-effective and free for everyone.</p>
          )}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Target Language</label>
            {mode === 'document' && docMode ? (
              <select id="doc-target" aria-label="Target Language" value={docTarget} onChange={e => { setDocTarget(e.target.value); clearTranslated(); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
                {docLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            ) : (
            <select aria-label="Target Language" value={targetLang} onChange={e => setTargetLang(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {languages.map(l => <option key={l}>{l}</option>)}
            </select>
            )}
          </div>
          <button onClick={mode === 'document' && docMode ? translateDocument : translate} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? (mode === 'document' && docMode ? officeStageLabel(stage) : 'Translating...') : 'Translate PDF'}
          </button>
          {translated && mode === 'document' && <DownloadReady file={translated} className="mt-3" />}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Translation (first 5 pages)</label>
              <TextArea aria-label="Translation (first 5 pages)" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={output} readOnly />
              <TextDownload text={output} name="translation.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Copy Translation</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Translate"
        description={`PDF Translate has two modes. "Text only" reads the first ${MAX_PDF_TRANSLATE_PAGES} pages of your PDF in the browser and sends up to ${MAX_PDF_TRANSLATE_CHARS.toLocaleString('en-US')} characters of their text through our server to OpenAI's gpt-4o-mini, then shows the translation in one of ${languages.length} languages. "Whole PDF (layout kept)" is offered only when our Google Cloud Translation service is set up: the PDF becomes a new PDF with the same layout, images and tables, in any of ${docLanguages.length} languages. A scanned page gives no text in "Text only".`}
        howToTitle="How to translate a PDF"
        howTo={[
          `Click or drop the PDF to translate.`,
          `If the page shows "Whole PDF (layout kept)" and "Text only", pick one; otherwise the text mode is used.`,
          `Choose the "Target Language" and click "Translate PDF".`,
          `Save a translated PDF with "Download"; for text, use "Copy Translation" or "Download" to get translation.txt.`,
        ]}
        specs={[
          { label: 'Input format', value: `PDF` },
          { label: 'Text only', value: `The first ${MAX_PDF_TRANSLATE_PAGES} pages, cut at ${MAX_PDF_TRANSLATE_CHARS.toLocaleString('en-US')} characters, into ${languages.length} languages; result on the page and as a .txt file` },
          { label: 'Whole PDF (layout kept)', value: `Up to 20 pages and 20 MB per PDF, and 20 pages a day per visitor, into ${docLanguages.length} languages` },
          { label: 'Usage limits', value: `Text only: hourly and daily limits per network shared with the site's paid tools, plus a monthly site budget. Whole PDF: its own monthly budget.` },
        ]}
        privacy={`In "Text only", the PDF stays in your browser and only the extracted text goes through our server to OpenAI. In "Whole PDF (layout kept)", the file is uploaded in parts to our media service, our server sends it to Google Cloud Translation, and the media service deletes the translated PDF as soon as this page has received it, or after a time limit.`}
        faqs={[
          { q: `How much of my PDF is translated?`, a: `${MAX_PDF_TRANSLATE_PAGES} pages at most in "Text only": the text of the first pages, cut at ${MAX_PDF_TRANSLATE_CHARS.toLocaleString('en-US')} characters. "Whole PDF (layout kept)", when the page offers it, translates up to 20 pages per PDF; split a longer file with Split PDF and translate the parts.` },
          { q: `Does the translation keep the layout?`, a: `Yes in "Whole PDF (layout kept)": Google Cloud Translation returns a new PDF with the same layout, images and tables. No in "Text only", which gives plain text on the page that you can copy or download.` },
          { q: `Which languages can a PDF be translated into?`, a: `${languages.length} in "Text only": English, French, Spanish, German, Arabic, Chinese, Japanese, Portuguese, Italian and Russian. ${docLanguages.length} in "Whole PDF (layout kept)", listed by name in the language menu.` },
          { q: `Is there a daily limit?`, a: `Yes. "Text only" counts toward an hourly and daily limit per network shared with the site's other paid tools, and toward a monthly site budget. "Whole PDF (layout kept)" allows 20 pages a day per visitor and has a monthly budget of its own.` },
        ]}
        tips={[
          `For a scanned PDF, run PDF OCR before using "Text only", since a scan has no text to extract.`,
        ]}
      />
    </div>
  );
}