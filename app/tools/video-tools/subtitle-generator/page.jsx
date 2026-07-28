'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function SubtitleGeneratorPage() {
  const [file, setFile] = useState(null);
  const [subtitles, setSubtitles] = useState([{ start: '00:00:00', end: '00:00:05', text: '' }]);
  const [srtContent, setSrtContent] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); };

  const addSubtitle = () => setSubtitles(prev => [...prev, { start: '00:00:00', end: '00:00:05', text: '' }]);
  const removeSubtitle = (i) => setSubtitles(prev => prev.filter((_,idx) => idx !== i));
  const updateSubtitle = (i, field, value) => setSubtitles(prev => prev.map((s,idx) => idx === i ? {...s, [field]: value} : s));

  const generate = () => {
    const srt = subtitles.map((s, i) => i+1 + '\n' + s.start + ',000 --> ' + s.end + ',000\n' + s.text + '\n').join('\n');
    setSrtContent(srt);
  };

  const download = () => {
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'subtitles.srt';
    a.click();
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Subtitle Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Create SRT subtitle files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="space-y-3">
            {subtitles.map((s, i) => (
              <div key={i} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">Subtitle {i+1}</span>
                  <button onClick={() => removeSubtitle(i)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs text-neutral-500 mb-1">Start (HH:MM:SS)</label><input type="text" value={s.start} onChange={e => updateSubtitle(i,'start',e.target.value)} className="w-full bg-neutral-200 rounded-lg p-2 font-mono text-sm" /></div>
                  <div><label className="block text-xs text-neutral-500 mb-1">End (HH:MM:SS)</label><input type="text" value={s.end} onChange={e => updateSubtitle(i,'end',e.target.value)} className="w-full bg-neutral-200 rounded-lg p-2 font-mono text-sm" /></div>
                </div>
                <input type="text" value={s.text} onChange={e => updateSubtitle(i,'text',e.target.value)} className="w-full bg-neutral-200 rounded-lg p-2 text-sm" placeholder="Subtitle text..." />
              </div>
            ))}
          </div>
          <button onClick={addSubtitle} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Add Subtitle</button>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate SRT</button>
          {srtContent && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={srtContent} readOnly />
              <button onClick={download} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download SRT</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Subtitle Generator"
        description="Subtitle Generator is a manual SRT subtitle builder — add rows with your own start time, end time, and text for each line, and it assembles a standard .srt file for you to download. Note: this tool doesn't watch or transcribe a video; you type each subtitle's timing and text yourself."
        howTo={[
          "Click \"Add Subtitle\" to create a new subtitle row.",
          "Enter the start and end time (HH:MM:SS) and the text for each row.",
          "Click \"Generate SRT\" to assemble your entries into standard SRT format.",
          "Click \"Download SRT\" to save the file."
        ]}
        faqs={[
          { q: "Does this transcribe audio or video automatically?", a: "No — this is a manual subtitle builder. You type each subtitle's timestamps and text yourself; nothing is auto-generated from a video file." },
          { q: "What format does it export?", a: "Standard .srt (SubRip) files only — VTT and ASS aren't available." },
          { q: "Does it support multiple languages?", a: "Yes — since you type the text yourself, you can enter subtitles in any language your keyboard supports." },
          { q: "Is Subtitle Generator free to use?", a: "Yes, it's completely free with no signup required." }
        ]}
        tips={[
          "Watch your video separately in another player to note down accurate start/end timestamps before typing them in here.",
          "Use the \"Remove\" button on a row to delete a mistaken entry before generating your SRT file.",
          "Keep timestamps in HH:MM:SS format exactly, since the generated SRT appends \",000\" for milliseconds automatically.",
          "For automatic AI-generated subtitles from an audio track, use a dedicated transcription tool first, then paste the timed results in here to fine-tune."
        ]}
      />
    </div>
  );
}