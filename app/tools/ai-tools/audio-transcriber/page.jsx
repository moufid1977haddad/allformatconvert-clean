'use client';
import { useState, useRef } from 'react';

export default function AudioTranscriberPage() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setOutput('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/ai-transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.text) setOutput(data.text);
      else setError(data.error || 'No response received');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Audio Transcriber</h1>
        <p className="text-neutral-500 text-center mb-8">Transcribe audio files with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {fileName ? <p className="text-neutral-700 text-sm font-medium">{fileName}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file (mp3, wav, m4a...)</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          {loading && <p className="text-center text-indigo-500 text-sm">Transcribing...</p>}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Transcript</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Transcriber</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Audio Transcriber tool. No signup required, no watermark, works on all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Why use OnlineConverTools?</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>100% free — no hidden fees</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No signup or account required</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Files processed locally — your data stays private</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Works on all devices — desktop, tablet, mobile</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No watermarks added to your files</li>
          </ul>
        </div>
      </div>
  );
}