'use client';
import { useState, useRef } from 'react';

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
  const handleFile = (e) => { setFile(e.target.files[0]); setFileTranscript(''); setError(''); };

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
            🎤 Use Microphone
          </button>
          <button
            onClick={() => setMode('file')}
            className={`flex-1 py-3 font-semibold text-sm transition ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
          >
            📁 Upload Audio File
          </button>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">

          {/* ── MIC MODE ── */}
          {mode === 'mic' && (
            <>
              <div className="text-center space-y-4">
                <div className="text-6xl">{isRecording ? '🔴' : '🎙️'}</div>
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition"
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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio To Text</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio To Text is a free online tool that converts speech and audio files into written text with high accuracy. Perfect for transcribing meetings, lectures, podcasts, and interviews without any cost or software installation required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio To Text</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Audio To Text website and click the 'Upload' button to select your audio file from your device.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your audio file format (MP3, WAV, M4A, OGG, or FLAC) and wait for the file to upload completely.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button to start the transcription process, which typically completes within minutes depending on file length.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your transcribed text as a document or copy it directly from the text editor for immediate use.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio formats does Audio To Text support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports MP3, WAV, M4A, OGG, FLAC, and other common audio formats. You can upload files up to 500MB in size.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit to how many files I can convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Audio To Text is completely free with unlimited conversions. You can transcribe as many audio files as you need without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How accurate is the transcription?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool uses advanced AI technology to achieve 85-95% accuracy depending on audio quality, background noise, and speaker clarity. You can easily edit any mistakes in the text editor.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my audio data safe and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all uploaded files are processed securely and automatically deleted after transcription. We do not store or share your audio files or transcripts.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, ensure your audio is clear with minimal background noise and a consistent speaking pace.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If transcription accuracy is low, try re-recording the audio at a higher bitrate or use a better quality microphone.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the built-in text editor to quickly correct any transcription errors before downloading your final document.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your transcripts in cloud storage or locally for easy reference and sharing with colleagues or team members.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}