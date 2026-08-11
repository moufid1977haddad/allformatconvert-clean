'use client';
import { useState, useRef } from 'react';
import { Mic, Folder } from 'lucide-react';
import SeoContent from '../../../components/SeoContent';

export default function AudioToTextPage() {
  // Mode : 'mic' ou 'file'
  const [mode, setMode] = useState('mic');

  // Mic state
  const [isRecording, setIsRecording] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const [micStatus, setMicStatus] = useState('');
  const recognition = useRef(null);

  // File state
  const [file, setFile] = useState(null);
  const [fileTranscript, setFileTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  // ── Mic functions ──
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMicStatus('Speech recognition not supported. Try Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SR();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setMicTranscript(text);
    };
    recognition.current.onerror = (e) => setMicStatus('Error: ' + e.error);
    recognition.current.start();
    setIsRecording(true);
    setMicStatus('Listening...');
  };

  const stopRecording = () => {
    if (recognition.current) recognition.current.stop();
    setIsRecording(false);
    setMicStatus('');
  };

  const downloadText = (text, filename) => {
    const b = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = filename;
    a.click();
  };

  // ── File functions ──
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setFileTranscript(''); setError(''); };

  const transcribeFile = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/ai-transcribe', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.text) setFileTranscript(data.text);
      else setError(data.error || 'Transcription failed');
    } catch (e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio to Text</h1>
        <p className="text-neutral-500 text-center mb-8">Transcribe speech or audio files to text</p>

        {/* Mode Selector */}
        <div className="flex rounded-xl overflow-hidden border border-neutral-200 mb-6">
          <button
            onClick={() => setMode('mic')}
            className={`flex-1 py-3 font-semibold text-sm transition ${mode === 'mic' ? 'bg-indigo-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
          >
            <Mic className="w-4 h-4 inline -mt-0.5 mr-1.5" /> Use Microphone
          </button>
          <button
            onClick={() => setMode('file')}
            className={`flex-1 py-3 font-semibold text-sm transition ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
          >
            <Folder className="w-4 h-4 inline -mt-0.5 mr-1.5" /> Upload Audio File
          </button>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">

          {/* ── MIC MODE ── */}
          {mode === 'mic' && (
            <>
              <div className="text-center space-y-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-indigo-100'}`}>
                  <Mic className={`w-10 h-10 ${isRecording ? 'text-red-500' : 'text-indigo-500'}`} />
                </div>
                {!isRecording ? (
                  <button onClick={startRecording} className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-8 py-3 font-semibold transition">
                    Start Transcription
                  </button>
                ) : (
                  <button onClick={stopRecording} className="bg-neutral-200 hover:bg-neutral-300 rounded-xl px-8 py-3 font-semibold transition">
                    Stop
                  </button>
                )}
                {micStatus && <p className="text-yellow-500 text-sm">{micStatus}</p>}
              </div>
              {micTranscript && (
                <div className="space-y-2">
                  <textarea
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none text-neutral-800"
                    value={micTranscript}
                    readOnly
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(micTranscript)}
                      className="bg-neutral-200 hover:bg-neutral-300 rounded-xl py-2 font-semibold transition text-neutral-800"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => downloadText(micTranscript, 'transcript.txt')}
                      className="bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
              <p className="text-neutral-400 text-xs text-center">Works best in Google Chrome with microphone permission</p>
            </>
          )}

          {/* ── FILE MODE ── */}
          {mode === 'file' && (
            <>
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition"
              >
                {file
                  ? <p className="text-neutral-700 font-medium">{file.name}</p>
                  : <p className="text-neutral-400 text-sm">Click to upload an audio file (MP3, WAV, M4A...)</p>
                }
              </div>
              <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
              {file && <audio controls src={URL.createObjectURL(file)} className="w-full" />}
              <button
                onClick={transcribeFile}
                disabled={!file || loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition"
              >
                {loading ? 'Transcribing...' : 'Transcribe Audio'}
              </button>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
              {fileTranscript && (
                <div className="space-y-2">
                  <label className="block text-sm text-neutral-500">Transcript</label>
                  <textarea
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none text-neutral-800"
                    value={fileTranscript}
                    readOnly
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(fileTranscript)}
                      className="bg-neutral-200 hover:bg-neutral-300 rounded-xl py-2 font-semibold transition text-neutral-800"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => downloadText(fileTranscript, 'transcript.txt')}
                      className="bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
      <SeoContent
        title="Audio to Text"
        description="Audio to Text offers two ways to get a transcript: live microphone dictation using your browser's built-in Speech Recognition (works best in Chrome, entirely local), or file upload, which sends your audio to a server-side AI transcription API and returns the text."
        howTo={[
          "Choose \"Use Microphone\" for live dictation, or \"Upload Audio File\" to transcribe an existing recording.",
          "For mic mode, click \"Start Transcription\" and speak — text appears as you talk.",
          "For file mode, upload your audio and click \"Transcribe Audio\" to send it for AI transcription.",
          "Copy the transcript or download it as a .txt file."
        ]}
        faqs={[
          { q: "Is my audio uploaded to a server?", a: "It depends on the mode: microphone dictation runs entirely in your browser via the Web Speech API and isn't uploaded anywhere. Uploaded audio files are sent to a server-side transcription API to generate the text." },
          { q: "Which browsers support microphone dictation?", a: "It relies on the Web Speech API, which works best in Google Chrome; other browsers may not support it." },
          { q: "What audio formats can I upload?", a: "Common formats like MP3, WAV, and M4A." },
          { q: "Is Audio to Text free to use?", a: "Yes, both the microphone and file-upload modes are free to use." }
        ]}
        tips={[
          "For live dictation, speak clearly at a steady pace and keep background noise low for the best accuracy.",
          "If microphone mode shows \"not supported,\" switch to Chrome or use file upload instead.",
          "Always proofread AI-generated transcripts before using them somewhere important — accuracy varies with audio quality.",
          "Download your transcript right after generating it, since it isn't saved automatically if you navigate away."
        ]}
      />
    </div>
  );
}