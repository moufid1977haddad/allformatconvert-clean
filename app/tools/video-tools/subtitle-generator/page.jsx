'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { buildSubtitles } from '../../../lib/subtitleTime';
import { DownloadGroup, TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function SubtitleGeneratorPage() {
  const [file, setFile] = useState(null);
  const [subtitles, setSubtitles] = useState([{ start: '00:00:00', end: '00:00:05', text: '' }]);
  const [srtContent, setSrtContent] = useState('');
  const [vttContent, setVttContent] = useState('');
  const [error, setError] = useToolError('');
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
        <p className="text-neutral-500 text-center mb-8">Create SRT and WebVTT subtitle files</p>
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
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={srtContent} readOnly />
              <DownloadGroup zipName="subtitles.zip" alternatives>
                <TextDownload text={srtContent} name="subtitles.srt" type="application/x-subrip" />
                <TextDownload text={vttContent} name="subtitles.vtt" type="text/vtt" />
              </DownloadGroup>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Subtitle Generator"
        description={`Subtitle Generator builds subtitle files by hand. For each line you type a start time, an end time and the text; "Generate SRT" checks every time, sorts the lines by start time, skips rows without text, and writes both an .srt (SubRip) and a .vtt (WebVTT) file. Times can be written as HH:MM:SS, MM:SS or plain seconds, with milliseconds after a dot or a comma. It does not listen to a video or audio file: for timed subtitles made from speech, use Audio to Text, which exports SRT and VTT itself.`}
        example={{ caption: `Two rows typed out of order, with short time formats (run with the page's own code, app/lib/subtitleTime.js).`, inputLabel: `Rows typed (start, end, text)`, input: `0:04,5   0:07   And we are back.
1.2      3      Hello and welcome.`, outputLabel: `subtitles.srt`, output: `1
00:00:01,200 --> 00:00:03,000
Hello and welcome.

2
00:00:04,500 --> 00:00:07,000
And we are back.` }}
        howToTitle="How to make an SRT subtitle file"
        howTo={[
          `Fill in "Start (HH:MM:SS.mmm)", "End (HH:MM:SS.mmm)" and the text of the first row.`,
          `Click "Add Subtitle" for each further line, and "Remove" to delete one.`,
          `Click "Generate SRT"; a time that cannot be read, or a line that ends before it starts, is pointed out by its number.`,
          `Check the SRT shown, then click "Download" next to subtitles.srt or subtitles.vtt, or "Download all" for both in a ZIP.`,
        ]}
        specs={[
          { label: `Input`, value: `Typed rows: a start, an end and one line of text each` },
          { label: `Output formats`, value: `SRT (subtitles.srt) and WebVTT (subtitles.vtt)` },
          { label: `Time format`, value: `HH:MM:SS, MM:SS or SS, with up to three decimals after a dot or comma; seconds up to 59, and minutes up to 59 when hours are given` },
        ]}
        privacy={`The subtitles are built on this page from what you type, and no text is sent to a server. If the page shows an error, such as a time it cannot read, that message goes to our error log with your browser's name and version, after quoted text has been removed from it.`}
        privacyTitle="Where your text is processed"
        faqs={[
          { q: `Does it create subtitles from a video automatically?`, a: `No. It is a manual builder: you type each time and line. For automatic subtitles, Audio to Text sends a recording to OpenAI Whisper and offers .srt and .vtt downloads with the timings already set.` },
          { q: `Can I type times without hours?`, a: `Yes: HH:MM:SS, MM:SS and plain seconds up to 59 all work, with up to three decimals after a dot or a comma. Seconds above 59, and minutes above 59 in HH:MM:SS, are refused with the row number; in MM:SS form, 75:00 is read as one hour and fifteen minutes.` },
          { q: `Can a subtitle have two lines?`, a: `No. Each row has a single-line text field, so every cue holds one line of text. Split a long sentence over two rows with consecutive times instead.` },
          { q: `Are the lines put in order?`, a: `Yes. Rows can be typed in any order; the files list them by start time and number the SRT cues from 1. Rows with no text are left out.` },
        ]}
        tips={[
          `Play your video in Media Player next to this page to read the times, then load the finished .srt there to check it.`,
        ]}
      />
    </div>
  );
}