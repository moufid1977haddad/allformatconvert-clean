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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Transcriber</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Transcriber is a free online tool that converts speech from audio files into accurate, editable text transcripts. Powered by advanced speech recognition technology, it supports multiple audio formats and languages, making transcription fast and accessible for everyone.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Transcriber</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Audio Transcriber website and click the 'Upload Audio' button to select your audio file from your device.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your audio language and format preferences, then click 'Start Transcription' to begin the conversion process.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the transcription to complete as the tool processes your audio file using AI-powered speech recognition.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download or copy your completed transcript in your preferred format, then edit and save it as needed.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Audio Transcriber really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Audio Transcriber is completely free with no hidden fees, sign-ups, or premium paywalls required to access basic transcription features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio Transcriber support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Transcriber supports all major audio formats including MP3, WAV, M4A, OGG, FLAC, and WebM files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long can my audio files be?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio files can typically be up to 2 hours long, with processing time varying based on file length and server availability.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my audio data private and secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Audio Transcriber uses secure encryption and automatically deletes uploaded files after transcription is complete to protect your privacy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best accuracy, ensure your audio is clear with minimal background noise before uploading to Audio Transcriber.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Audio Transcriber for interviews, meetings, lectures, and podcasts to quickly create searchable text records.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Review and manually edit the transcript after generation to correct any technical terms or proper nouns the AI may have misinterpreted.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export your transcripts in multiple formats like TXT, PDF, or DOCX for easy sharing, archiving, or further editing in other applications.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}