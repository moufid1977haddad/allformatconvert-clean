'use client';
import { useState, useRef } from 'react';
export default function VideoToAudioPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Extracting audio...');
    try {
      const audioCtx = new AudioContext();
      const ab = await file.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab);
      const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineCtx.destination);
      source.start();
      const rendered = await offlineCtx.startRendering();
      const data = rendered.getChannelData(0);
      const wav = new ArrayBuffer(44 + data.length * 2);
      const view = new DataView(wav);
      const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
      write(0,'RIFF'); view.setUint32(4,36+data.length*2,true); write(8,'WAVE'); write(12,'fmt ');
      view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
      view.setUint32(24,rendered.sampleRate,true); view.setUint32(28,rendered.sampleRate*2,true);
      view.setUint16(32,2,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,data.length*2,true);
      let o = 44;
      for (let i = 0; i < data.length; i++) { const s = Math.max(-1,Math.min(1,data[i])); view.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
      setResult(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Video to Audio</h1>
        <p className="text-neutral-500 text-center mb-8">Extract audio from video files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a video file here'}</p>
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
          </div>
          {status && <p className="text-yellow-400 text-center text-sm">{status}</p>}
          <button onClick={extract} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Extracting...' : 'Extract Audio'}</button>
          {result && <div className="space-y-2"><audio controls src={result} className="w-full" /><a href={result} download="audio.wav" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download WAV</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Video To Audio</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Video To Audio is a free online tool that converts your video files into high-quality audio formats instantly without any software installation required. Simply upload your video and download the extracted audio in MP3, WAV, or other popular formats within seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Video To Audio</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Video To Audio website and click the 'Upload Video' button to select your video file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your desired output audio format (MP3, WAV, AAC, OGG, or FLAC) from the format selection dropdown menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button and wait for the tool to process and extract the audio from your video</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Once conversion is complete, click the 'Download' button to save your audio file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Video To Audio support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports all major video formats including MP4, AVI, MOV, WMV, FLV, MKV, WEBM, and more.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploads?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most videos up to 500MB can be converted. For larger files, consider splitting your video or compressing it first.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Video To Audio?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account is required. The tool is completely free to use without registration or login.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does the conversion process take?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Conversion time depends on your video length and file size, but typically takes between 30 seconds to 2 minutes.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For faster conversion, upload videos shorter than 10 minutes and ensure your internet connection is stable</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Choose MP3 format if you want maximum compatibility with all devices and media players</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Trim your video before conversion if you only need audio from a specific section to reduce file size</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check the audio bitrate settings before conversion if you need higher quality audio for professional use</li>
          </ul>
        </div>
      </div>
    </div>
  );
}