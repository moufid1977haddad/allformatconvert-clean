'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkFileSize, MAX_AUDIO_UPLOAD_BYTES } from '@/lib/quota/limits';

export default function AudioTranscriberPage() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setFileName(file.name);
    setLoading(true);
    setOutput('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool', 'audio-transcriber');
      const sizeCheck = checkFileSize(file, MAX_AUDIO_UPLOAD_BYTES, 'Audio files');
      if (!sizeCheck.ok) { setLoading(false); setError(sizeCheck.message); return; }
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
      <SeoContent
        title="Audio Transcriber"
        description="Audio Transcriber is a free online tool that converts speech in an audio file into text using OpenAI's Whisper speech recognition model. Upload an audio file and the tool automatically detects the spoken language and returns an editable text transcript — no manual settings required."
        howTo={[
          "Click the upload area and select an audio file (MP3, WAV, M4A, and similar formats).",
          "Transcription starts automatically as soon as the file is uploaded.",
          "Wait while the audio is processed using AI-powered speech recognition.",
          "Copy your completed transcript and edit it as needed."
        ]}
        faqs={[
          { q: "Is Audio Transcriber really free to use?", a: "Yes, Audio Transcriber is free to use with no signup or subscription required." },
          { q: "What audio formats does Audio Transcriber support?", a: "It accepts common audio formats such as MP3, WAV, and M4A, and most other formats your browser can select as an audio file." },
          { q: "How large can my audio file be?", a: "The underlying transcription API has a file size limit of around 25MB. For longer recordings, split the audio into smaller segments and transcribe each one separately." },
          { q: "Is my audio data private?", a: "Your audio file is sent directly to the transcription API to generate the transcript. It is not stored on our servers." }
        ]}
        tips={[
          "For best accuracy, use audio that is clear with minimal background noise.",
          "Audio Transcriber works well for interviews, meetings, lectures, and podcasts.",
          "Review and manually correct the transcript afterward, especially for technical terms or proper nouns.",
          "Split long recordings into shorter clips if you hit the file size limit."
        ]}
      />
    </div>
  );
}