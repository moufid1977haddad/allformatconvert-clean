'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { buildSubtitles } from '../../../lib/subtitleTime';
import { DownloadGroup, TextDownload } from '../../../components/FileDownload';
export default function SubtitleGeneratorPage() {
  const [file, setFile] = useState(null);
  const [subtitles, setSubtitles] = useState([{ start: '00:00:00', end: '00:00:05', text: '' }]);
  const [srtContent, setSrtContent] = useState('');
  const [vttContent, setVttContent] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); };

  const addSubtitle = () => setSubtitles(prev => [...prev, { start: '00:00:00', end: '00:00:05', text: '' }]);
  const removeSubtitle = (i) => setSubtitles(prev => prev.filter((_,idx) => idx !== i));
  const updateSubtitle = (i, field, value) => setSubtitles(prev => prev.map((s,idx) => idx === i ? {...s, [field]: value} : s));

  // Times validated and written as real SRT / WebVTT timings, cues sorted (lib/subtitleTime.js, 29/09).
  const generate = () => {
    const r = buildSubtitles(subtitles);
    if (r.error) { setError(r.error); setSrtContent(''); setVttContent(''); return; }
    setError('');
    setSrtContent(r.srt);
    setVttContent(r.vtt);
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
                  <div><label className="block text-xs text-neutral-500 mb-1">Start (HH:MM:SS.mmm)</label><input aria-label="Start (HH:MM:SS.mmm)" type="text" value={s.start} onChange={e => updateSubtitle(i,'start',e.target.value)} className="w-full bg-neutral-200 rounded-lg p-2 font-mono text-sm" /></div>
                  <div><label className="block text-xs text-neutral-500 mb-1">End (HH:MM:SS.mmm)</label><input aria-label="End (HH:MM:SS.mmm)" type="text" value={s.end} onChange={e => updateSubtitle(i,'end',e.target.value)} className="w-full bg-neutral-200 rounded-lg p-2 font-mono text-sm" /></div>
                </div>
                <input type="text" value={s.text} onChange={e => updateSubtitle(i,'text',e.target.value)} className="w-full bg-neutral-200 rounded-lg p-2 text-sm" placeholder="Subtitle text..." />
              </div>
            ))}
          </div>
          <button onClick={addSubtitle} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Add Subtitle</button>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition text-white">Generate SRT</button>
          {error && <p role="alert" className="text-red-600 text-sm text-center">{error}</p>}
          {srtContent && (
            <div className="space-y-2">
              <textarea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={srtContent} readOnly />
              <DownloadGroup zipName="subtitles.zip">
                <TextDownload text={srtContent} name="subtitles.srt" type="application/x-subrip" />
                <TextDownload text={vttContent} name="subtitles.vtt" type="text/vtt" />
              </DownloadGroup>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Subtitle Generator"
        description="Subtitle Generator is a manual SRT subtitle builder — add rows with your own start time, end time, and text for each line, and it assembles a standard .srt file (or a .vtt WebVTT file) for you to download, with times checked and lines put in time order. Note: this tool doesn't watch or transcribe a video; you type each subtitle's timing and text yourself."
        howTo={[
          "Click \"Add Subtitle\" to create a new subtitle row.",
          "Enter the start and end time (HH:MM:SS, with milliseconds if needed: 00:00:05.500) and the text for each row.",
          "Click \"Generate SRT\" to assemble your entries into standard SRT format.",
          "Click \"Download SRT\" or \"Download VTT\" to save the file."
        ]}
        faqs={[
          { q: "Does this transcribe audio or video automatically?", a: "No — this is a manual subtitle builder. You type each subtitle's timestamps and text yourself; nothing is auto-generated from a video file." },
          { q: "What format does it export?", a: "Standard .srt (SubRip) and .vtt (WebVTT, for web players) files. ASS isn't available." },
          { q: "How do I type times?", a: "HH:MM:SS, MM:SS or seconds, with optional milliseconds after a dot or comma (00:01:05.250, 1:05,25). A time that can't be read, or a line that ends before it starts, is pointed out instead of producing a broken file; lines are put in time order and empty lines are skipped." },
          { q: "Does it support multiple languages?", a: "Yes — since you type the text yourself, you can enter subtitles in any language your keyboard supports." },
          { q: "Is Subtitle Generator free to use?", a: "Yes, it's completely free with no signup required." }
        ]}
        tips={[
          "Watch your video separately in another player to note down accurate start/end timestamps before typing them in here.",
          "Use the \"Remove\" button on a row to delete a mistaken entry before generating your SRT file.",
          "Add milliseconds (00:00:05.500) when a line must appear between two seconds; without them the time is on the second.",
          "For automatic AI-generated subtitles from an audio track, use a dedicated transcription tool first, then paste the timed results in here to fine-tune."
        ]}
      />
    </div>
  );
}