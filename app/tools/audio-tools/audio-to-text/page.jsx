'use client';
import { useState, useRef } from 'react';
import { Mic, Folder } from 'lucide-react';
import SeoContent from '../../../components/SeoContent';
import { transcribeAudio, checkAudioSize, audioMaxBytes, audioMaxLabel } from '../../../lib/officeUpload';
import { encryptedMusicMessage } from '../../../lib/mediaSupport';
import TranscriptExports from '../../../components/TranscriptExports';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

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
  const [fileSegments, setFileSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
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


  // ── File functions ──
  // Checked immediately on selection (not just before the network request)
  // so an oversized file is flagged the moment it's picked, rather than
  // only after the visitor has already clicked "Transcribe Audio" and
  // waited for the button to respond.
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && encryptedMusicMessage(f.name)) { e.target.value = ''; setError(encryptedMusicMessage(f.name)); return; }
    e.target.value = '';
    setFile(f);
    setFileTranscript('');
    const sizeCheck = checkAudioSize(f);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
  };

  const transcribeFile = async () => {
    if (!file) return;
    const sizeCheck = checkAudioSize(file);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setError('');
    try {
      const data = await transcribeAudio({ file, tool: 'audio-to-text' });
      if (data.text) { setFileTranscript(data.text); setFileSegments(Array.isArray(data.segments) ? data.segments : []); }
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
                  <TextArea aria-label="Result"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none text-neutral-800"
                    value={micTranscript}
                    readOnly
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(micTranscript)}
                    className="w-full bg-neutral-200 hover:bg-neutral-300 rounded-xl py-2 font-semibold transition text-neutral-800"
                  >
                    Copy
                  </button>
                  <TextDownload text={micTranscript} name="transcript.txt" />
                </div>
              )}
              <p className="text-neutral-500 text-xs text-center">Needs a browser with speech recognition, such as Chrome, and microphone permission</p>
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
                  : <p className="text-neutral-500 text-sm"><UploadPrompt what="an audio file" /> (MP3, WAV, M4A...)</p>
                }
              </div>
              <p className="text-neutral-500 text-xs text-center -mt-2">Max {audioMaxLabel()} per file</p>
              <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
              {file && <audio controls src={URL.createObjectURL(file)} className="w-full" />}
              <button
                onClick={transcribeFile}
                disabled={!file || loading || file.size > audioMaxBytes()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition"
              >
                {loading ? 'Transcribing...' : 'Transcribe Audio'}
              </button>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
              {fileTranscript && (
                <div className="space-y-2">
                  <label className="block text-sm text-neutral-500">Transcript</label>
                  <TextArea aria-label="Transcript"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none text-neutral-800"
                    value={fileTranscript}
                    readOnly
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(fileTranscript)}
                    className="w-full bg-neutral-200 hover:bg-neutral-300 rounded-xl py-2 font-semibold transition text-neutral-800"
                  >
                    Copy
                  </button>
                  <TranscriptExports text={fileTranscript} segments={fileSegments} baseName={file?.name} />
                </div>
              )}
            </>
          )}

        </div>
      </div>
      <SeoContent
        title="Audio to Text"
        description={`Audio to Text has two modes. "Use Microphone" types what you say as you speak, with the speech recognition built into your browser; Firefox does not have it. "Upload Audio File" sends one recording to OpenAI's Whisper model through our server and returns the transcript, plus timed SRT and VTT subtitles when Whisper sends segments. The recording is passed on exactly as picked, and any format Whisper turns down is reported back on the page. The text can be copied or downloaded. It does not translate and does not keep your transcripts.`}
        howToTitle="How to transcribe speech to text"
        howTo={[
          `Choose "Use Microphone" for live dictation or "Upload Audio File" for a recording.`,
          `Microphone: click "Start Transcription", allow the microphone, speak, then click "Stop".`,
          `File: pick or drop an audio file of up to ${audioMaxLabel()} and click "Transcribe Audio".`,
          `Click "Copy", or "Download" the .txt file; a transcribed file also offers .srt and .vtt subtitles.`,
        ]}
        specs={[
          { label: `Input`, value: `Your microphone, or one audio file in a type Whisper reads; it is not converted first` },
          { label: `Maximum file size`, value: `Up to ${audioMaxLabel()}, the ceiling of OpenAI's Whisper API` },
          { label: `Output`, value: `Text to copy; TXT; SRT and VTT for uploaded files when timings come back` },
          { label: `Usage limits`, value: `File mode: one hourly and daily allowance per connection, shared with the site's other AI tools, under a monthly budget for the site's paid services; a file over 4 MB also uses the upload service's own hourly and daily allowance. Microphone mode is not counted.` },
          { label: `Microphone browsers`, value: `Needs the speech recognition of the browser; without it the page shows "Speech recognition not supported. Try Chrome."` },
        ]}
        privacy={`Microphone mode: your browser's own speech service does the recognition (Chrome, for example, sends the sound to Google), and the page only receives the words. File mode: your file goes to our server, which sends it to OpenAI's transcription API (model whisper-1). Files over 4 MB first travel to our media service, which deletes them once read. We keep no copy; OpenAI's own data rules apply on its side. Error messages shown on the page, cleaned, are sent to our error log with your browser's name and version.`}
        privacyTitle="Where your audio is processed"
        faqs={[
          { q: `Does microphone dictation work in every browser?`, a: `No. It needs the speech recognition built into the browser: Chrome has it, Firefox does not and shows "Speech recognition not supported. Try Chrome." File upload works in any browser, since the transcription itself runs at OpenAI.` },
          { q: `How large a recording can I upload?`, a: `Up to ${audioMaxLabel()}; a bigger file is refused the moment you pick it, before anything is sent, and the button stays off. Cut a long recording with Audio Splitter, or save it as MP3 with Audio Compressor, then transcribe the result.` },
          { q: `Can I get subtitles with timestamps?`, a: `Yes, for uploaded files: each timed segment Whisper sends back becomes one subtitle cue, saved as .srt or .vtt, and "Download all" zips them with the .txt. Microphone mode gives plain text only.` },
          { q: `How many files can I transcribe per day?`, a: `A set number per connection, per hour and per day, shared with the site's other AI tools, and only while the monthly budget for paid services lasts; the page says when a limit is reached. The numbers are server settings, not shown here. Live dictation does not count.` },
          { q: `Is my recording stored?`, a: `No, not by us. An uploaded file is passed to OpenAI and the text comes back; a file over 4 MB is deleted from our media service once read. Live dictation never reaches our server: it goes to the speech service of your browser.` },
        ]}
      />
    </div>
  );
}