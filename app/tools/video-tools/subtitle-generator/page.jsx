'use client';
import { useState, useRef } from 'react';
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
    </div>
  );
}