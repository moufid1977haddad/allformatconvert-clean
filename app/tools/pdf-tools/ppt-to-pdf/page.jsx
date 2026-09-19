'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function PptToPdfPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [detectedFonts, setDetectedFonts] = useState([]);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setError('');
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setDone(false);
    setDetectedFonts([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert-to-pdf', { method: 'POST', body: formData });

      if (!res.ok) {
        let message = 'Conversion failed. Please try again.';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // Response wasn't JSON; fall back to the generic message above.
        }
        throw new Error(message);
      }

      const detectedFontsHeader = res.headers.get('X-Detected-Symbol-Fonts');
      setDetectedFonts(detectedFontsHeader ? detectedFontsHeader.split(',') : []);

      const blob = await res.blob();
      const filename = (file.name.replace(/\.[^.]+$/, '') || 'presentation') + '.pdf';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Oxford-comma join: "Wingdings", "Wingdings and Webdings", or
  // "Wingdings, Wingdings 2, and Wingdings 3" for the rare 3+ case.
  const detectedFontsList = detectedFonts.length <= 2
    ? detectedFonts.join(' and ')
    : `${detectedFonts.slice(0, -1).join(', ')}, and ${detectedFonts[detectedFonts.length - 1]}`;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PowerPoint to PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Convert .pptx or .ppt files to PDF using LibreOffice</p>
        <p className="text-neutral-400 text-xs text-center mb-8">In our tests, layout, images, gradients, tables and charts carried over. A text box narrower than its text can wrap and be partly hidden, and Wingdings and Webdings icon fonts can&apos;t legally be reproduced and will appear blank.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a .pptx or .ppt file here'}</p>
            <input ref={inputRef} type="file" accept=".pptx,.ppt" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
            {loading && (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {loading ? 'Converting...' : 'Download PDF'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-1">PDF downloaded!</div>
              <p className="text-neutral-500 text-sm">Check your browser's downloads for the converted file.</p>
              {detectedFonts.length > 0 && (
                <p className="text-amber-600 text-sm mt-3">
                  Heads up: this file uses {detectedFontsList} icon font{detectedFonts.length > 1 ? 's' : ''}, which can&apos;t legally be reproduced — those specific characters may appear as blank boxes in your PDF. Everything else converted normally.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PowerPoint to PDF"
        description="PowerPoint to PDF converts your .pptx or .ppt file into a PDF using LibreOffice. Your file is uploaded securely over HTTPS to our conversion service for processing, then deleted immediately afterward — it isn't stored, logged, or kept around. We tested .pptx files with custom slide backgrounds, two-level bullets, a full-bleed image, overlapping shapes and text boxes, a gradient fill, a table and a pie chart: all of them matched the output of two other online converters. Three disclosed limits. First, text boxes: PowerPoint lets the text of a box set to 'do not wrap' run past the edge of the box, while our converter (LibreOffice) wraps it at the edge. In our test a slide title in such a box, longer than the box, wrapped onto a second line and part of it was hidden behind an overlapping text box — this also happened when converting with the real Segoe UI font, so it is not a font problem. Second, fonts: a font not installed on our conversion servers is substituted with a similar typeface rather than left blank; Segoe UI, which is Windows-only, is replaced by Selawik, Microsoft's open replacement, whose letter widths matched Segoe UI in our measurement (its kerning is not identical). Third, and not a substitution: Wingdings and Webdings icon fonts can't legally be embedded in our conversion service (a font-licensing restriction, not a bug), so those specific characters come through as blank boxes if your presentation uses them. We measured .pptx only, not the older .ppt format."
        howTo={[
          "Click the upload area and select a .pptx or .ppt file from your device.",
          "Click 'Download PDF'. Your file is uploaded securely for conversion and the PDF downloads automatically once it's ready.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is PowerPoint to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does PowerPoint to PDF support?", a: "Both .pptx and the older binary .ppt format are supported — both go through the same LibreOffice-based conversion service." },
          { q: "Will my presentations be uploaded to a server?", a: "Yes. Your file is uploaded securely over HTTPS to our conversion service, which uses LibreOffice to generate the PDF, and is deleted immediately after conversion — it isn't stored or kept." },
          { q: "Do I need to install any software to use PowerPoint to PDF?", a: "No, it works directly in your web browser." },
          { q: "Will each slide become its own PDF page?", a: "Yes. Each slide in your presentation is rendered as one page in the resulting PDF, in its original order." },
          { q: "Why does this look different from the previous in-browser converter?", a: "This tool now converts presentations server-side with LibreOffice instead of approximating the layout in your browser. The trade-off is that your file is uploaded; in return, layout, images and shapes follow the original presentation, and transitions are rendered as static slides." },
          { q: "What happens if my presentation uses a font that isn't common?", a: "A font not installed on our conversion servers is substituted with a similar typeface rather than left blank, except Wingdings and Webdings, which can't legally be reproduced and come through as blank boxes instead. Segoe UI, which is Windows-only, is replaced by Selawik, whose letter widths matched Segoe UI in our measurement. A different substitute can be wider or narrower than the original font, which can change where a line breaks." }
        ]}
        tips={[
          "In our tests on .pptx files, images, shapes, gradients, tables and charts matched two other online converters.",
          "Each slide becomes one page in the PDF, in its original order.",
          "Make each text box at least as wide as its text: a box set to \"do not wrap\" that is narrower than its text wraps in our converter and can hide part of it behind other shapes.",
          "Very large presentations or ones with many embedded media files may take a little longer to convert — keep the tab open until the download starts."
        ]}
      />
    </div>
  );
}
