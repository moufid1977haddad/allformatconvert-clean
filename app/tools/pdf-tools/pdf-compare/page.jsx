'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { itemsToText } from '../../../lib/pdfTextLayout';
import { diffLines } from '../../../lib/codeTools';
import { loadPdfjs } from '../../../lib/pdfjs';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';
import { withActualTextUnicode } from '../../../lib/pdfActualText';

export default function Page() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const [diff, setDiff] = useState(null);
  const file1Ref = useRef();
  const file2Ref = useRef();

  const extractText = async (file) => {
    const pdfjsLib = await loadPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: await withActualTextUnicode(arrayBuffer) }).promise;
    let text = '';
    const pageOfLine = []; // P24 (03/10): the page each line comes from, shown next to it (Draftable, PDF24 Compare)
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = itemsToText(content.items);
      text += pageText + '\n';
      for (let k = pageText.split('\n').length; k > 0; k--) pageOfLine.push(i);
    }
    return { text, pageOfLine };
  };

  const compare = async () => {
    if (!file1 || !file2) return;
    setLoading(true);
    setError('');
    try {
      const [r1, r2] = await Promise.all([extractText(file1), extractText(file2)]);
      const t1 = r1.text, t2 = r2.text;
      setText1(t1);
      setText2(t2);
      // Line-by-line differences (Myers, as Diffchecker): the page used to show
      // the two texts side by side with nothing marked (29/09).
      const d = await diffLines(t1, t2, { ignoreWhitespace: true });
      // P24 (03/10): the page of each line, and inside a changed line the words that differ (as Diff Viewer does)
      const { diffWords } = await import('diff');
      for (const row of d) { if (row.oldNum) row.page1 = r1.pageOfLine[row.oldNum - 1]; if (row.newNum) row.page2 = r2.pageOfLine[row.newNum - 1]; }
      for (let i = 0; i < d.length;) {
        if (d[i].type === 'same') { i++; continue; }
        const rem = [], add = [];
        while (i < d.length && d[i].type === 'removed') rem.push(d[i++]);
        while (i < d.length && d[i].type === 'added') add.push(d[i++]);
        for (let k = 0; k < Math.min(rem.length, add.length); k++) {
          const words = diffWords(rem[k].line, add[k].line);
          rem[k].parts = words.filter((w) => !w.added);
          add[k].parts = words.filter((w) => !w.removed);
        }
      }
      setDiff(d);
    } catch(e) { setError('Failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Compare PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two PDF documents side by side</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => file1Ref.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition">
              {file1 ? <p className="text-neutral-700 text-sm font-medium">{file1.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="PDF 1" /></p>}
            </div>
            <div onClick={() => file2Ref.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition">
              {file2 ? <p className="text-neutral-700 text-sm font-medium">{file2.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="PDF 2" /></p>}
            </div>
          </div>
          <input ref={file1Ref} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files[0]; e.target.value = ''; setFile1(f); }} />
          <input ref={file2Ref} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files[0]; e.target.value = ''; setFile2(f); }} />
          <button onClick={compare} disabled={!file1 || !file2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Comparing...' : 'Compare PDFs'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {diff && (
            <div className="space-y-1">
              {(() => { /* P24 review (03/10): two scanned PDFs (pictures, no text) were announced as having no differences */ const t1 = diff.some((d) => d.type !== 'added' && d.line.trim()), t2 = diff.some((d) => d.type !== 'removed' && d.line.trim()); return !t1 || !t2 ? <p role="alert" className="text-sm text-amber-700 text-center" data-no-text>{!t1 && !t2 ? 'Neither PDF has text to compare: scanned pages are pictures. Make them searchable with PDF OCR first, then compare.' : `${!t1 ? file1.name : file2.name} has no text (scanned pages are pictures): use PDF OCR on it first.`}</p> : null; })()}
              <p className="text-sm text-neutral-600 text-center">{diff.filter(d => d.type === 'removed').length} line(s) only in {file1.name} (red) · {diff.filter(d => d.type === 'added').length} line(s) only in {file2.name} (green)</p>
              <div className="font-mono text-xs max-h-96 overflow-y-auto border border-neutral-200 rounded-xl">
                {diff.map((d, i) => (
                  <div key={i} className={'px-3 py-0.5 whitespace-pre-wrap ' + (d.type === 'removed' ? 'bg-red-50 text-red-700' : d.type === 'added' ? 'bg-green-50 text-green-700' : 'text-neutral-500')}>
                    <span className="inline-block w-14 text-neutral-400 select-none" data-page>{d.type === 'added' ? `p. ${d.page2}` : `p. ${d.page1}`}</span>
                    {d.type === 'removed' ? '- ' : d.type === 'added' ? '+ ' : '  '}{d.parts ? d.parts.map((w, k) => <span key={k} className={w.removed ? 'bg-red-200 rounded' : w.added ? 'bg-green-200 rounded' : ''}>{w.value}</span>) : d.line}
                  </div>
                ))}
              </div>
            </div>
          )}
          {text1 && text2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">{file1.name}</p>
                <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs h-64 resize-none" value={text1} readOnly />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">{file2.name}</p>
                <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs h-64 resize-none" value={text2} readOnly />
              </div>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Compare PDF"
        description={`Compare PDF reads the text of two PDF files and lists the lines that differ: lines found only in the first file are shown in red, lines only in the second in green, and inside a changed line the words that differ are highlighted. Each line carries the number of the page it comes from, and spacing differences are ignored. Both full texts are then shown side by side. It compares text only, not layout, images or fonts, and a scanned PDF has no text to compare. PDF.js reads both files inside your browser tab.`}
        howToTitle="How to compare two PDF files"
        howTo={[
          `Click the left box and choose the first PDF, for example the older version.`,
          `Click the right box and choose the second PDF.`,
          `Click "Compare PDFs".`,
          `Read the count of changed lines and the red and green lines with their page numbers, then the two full texts below for context; nothing is downloaded.`,
        ]}
        specs={[
          { label: 'Input', value: `Two PDF files, one in each box` },
          { label: 'Result', value: `On-screen list of differences and both texts; no file to download` },
          { label: 'Compared', value: `Text lines, with spacing ignored; layout, pictures and fonts are not compared` },
          { label: 'Scanned PDFs', value: `No text to compare: the page says which file has none, or that neither has, and suggests PDF OCR` },
        ]}
        privacy={`Both PDFs are read in your browser by PDF.js; the files and their text are not uploaded to our servers. If the page shows an error, a cleaned copy of that message, the tool's name and your browser's name and version are reported to us so it can be fixed; your files and their text are never part of that report.`}
        faqs={[
          { q: "Does it also show which words changed inside a line?", a: `Yes. A line found only in one file is colored red or green, and when a removed line pairs with an added one, the words that differ inside them are highlighted. Each line also shows the page it comes from, so you can find it in the original document.` },
          { q: "Can I compare two scanned PDFs?", a: `No. A scan stores pictures of pages, not text, so there is nothing to compare. With two scans, the page says that neither PDF has text; run both through PDF OCR to get searchable PDFs, then compare those copies instead.` },
          { q: "Are changes in spacing reported as differences?", a: `No. Before the comparison, each line is trimmed and runs of spaces are reduced to one, so spacing alone never counts. Text that moved to another line can still appear as one line removed and one line added.` },
          { q: "Does it compare formatting, pictures or layout?", a: `No. Only the text that PDF.js reads from each page is compared. A new font, a moved picture or a different color with the same words gives no difference, and lines follow the order in which each file stores its text.` },
        ]}
        tips={[
          `Put the older version in the left box: lines that were removed then show in red, new lines in green.`,
          `For two scanned versions of a contract, run PDF OCR on both first, then compare the searchable copies.`,
        ]}
      />
    </div>
  );
}