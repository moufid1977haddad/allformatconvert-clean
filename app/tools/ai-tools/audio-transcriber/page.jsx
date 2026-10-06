'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { transcribeAudio, checkAudioSize, audioMaxLabel } from '../../../lib/officeUpload';
import { OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import { encryptedMusicMessage } from '../../../lib/mediaSupport';
import TranscriptExports from '../../../components/TranscriptExports';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

export default function AudioTranscriberPage() {
  const [output, setOutput] = useState('');
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (file && encryptedMusicMessage(file.name)) { e.target.value = ''; setError(encryptedMusicMessage(file.name)); return; }
    if (!file) return;
    e.target.value = '';
    setFileName(file.name);
    setLoading(true);
    setOutput('');
    setSegments([]);
    setError('');
    try {
      const sizeCheck = checkAudioSize(file);
      if (!sizeCheck.ok) { setLoading(false); setError(sizeCheck.message); return; }
      const data = await transcribeAudio({ file, tool: 'audio-transcriber' });
      if (data.text) { setOutput(data.text); setSegments(Array.isArray(data.segments) ? data.segments : []); }
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
            {fileName ? <p className="text-neutral-700 text-sm font-medium">{fileName}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="an audio file" /> (mp3, wav, m4a...)</p>}
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {audioMaxLabel()} per file</p>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          {loading && <p className="text-center text-indigo-500 text-sm">Transcribing...</p>}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Transcript</label>
              <TextArea aria-label="Transcript" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              <TranscriptExports text={output} segments={segments} baseName={fileName} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Audio Transcriber"
        description={`Audio Transcriber turns the speech in a recorded audio file into text with OpenAI's Whisper model. Pick a file and transcription starts at once; Whisper works out the spoken language, so there is nothing to set. Files up to ${audioMaxLabel()} are accepted: up to ${OFFICE_STAGED_THRESHOLD_BYTES / 1048576} MB they go through our server, larger ones are first uploaded in parts to our media service. You get the transcript as read-only text, plus TXT, SRT and VTT downloads with start and end times. It does not record from a microphone; for live dictation, use Audio to Text.`}
        howToTitle="How to transcribe an audio file"
        howTo={[
          "Click the upload area and choose an audio file, such as MP3, WAV or M4A.",
          "Wait while \"Transcribing...\" is shown; there is no button to press.",
          "Read the text under \"Transcript\" and click \"Copy\" to copy it.",
          "Click \"Download\" next to the .txt, .srt or .vtt file, or \"Download all\" for a ZIP of the files."
        ]}
        specs={[
          { label: "Input", value: "Audio files such as MP3, WAV and M4A, passed to Whisper unchanged" },
          { label: "Maximum file size", value: `${audioMaxLabel()} per file` },
          { label: "Output", value: "Text, TXT, SRT and VTT (subtitles when Whisper returns timed segments)" },
          { label: "Language", value: "Detected by Whisper; the page has no language setting" },
          { label: "Usage limits", value: "Transcriptions per connection are limited per hour and per day, in one allowance with the site's other paid tools, under a monthly site budget; large files also count toward the upload service's own limits" }
        ]}
        privacyTitle="Where your audio is processed"
        privacy={`The audio is not processed in your browser but sent to our server: a file up to ${OFFICE_STAGED_THRESHOLD_BYTES / 1048576} MB goes from there to OpenAI's Whisper API. A larger file is first uploaded in parts to our media service on Railway, read from there by our server, and deleted from the service once the transcript is done. We store neither the audio nor the text.`}
        faqs={[
          { q: "How large can the audio file be?", a: `${audioMaxLabel()}, the most OpenAI's Whisper accepts in one request. Split a longer recording into parts and transcribe them one by one; a compressed MP3 holds far more minutes than a WAV file of the same size.` },
          { q: "Can I make subtitles for a video?", a: "Yes, from its sound track: extract the audio with Video to Audio, then transcribe it here. Each line of the SRT and WebVTT files carries the start and end time of one of Whisper's segments, ready for YouTube, VLC or a video editor." },
          { q: "Do I have to choose the language?", a: "No. The page sends no language setting, and Whisper works out the spoken language itself. The transcript is written in that language and is not translated; for a translation, paste the text into AI Translator." },
          { q: "Does it accept MP3, WAV and M4A files?", a: "Yes, these are the types named on the upload area. Our server hands your recording to Whisper untouched, and when Whisper rejects a type, its message is shown on the page. Encrypted music downloads, from Apple Music or QQ Music for example, are stopped before upload with an explanation." },
          { q: "Can I edit the transcript on the page?", a: "No. The transcript box is read-only. Copy the text, or download the TXT file, and correct names and technical terms in any text editor or word processor." }
        ]}
        tips={[
          "If a recording is over the size limit, convert it to MP3 with Audio Converter or cut it into parts with Audio Splitter."
        ]}
      />
    </div>
  );
}