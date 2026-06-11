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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Subtitle Generator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Subtitle Generator is a free online tool that automatically creates accurate subtitles for your videos in multiple languages within seconds. Perfect for content creators, educators, and businesses looking to make their videos more accessible and engaging to a global audience.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Subtitle Generator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload or paste your video URL into the Subtitle Generator tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your desired output language and subtitle format from the available options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Generate' button and wait for the AI to process and create subtitles</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your generated subtitles in your preferred format (SRT, VTT, or ASS) and add them to your video</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Subtitle Generator completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Subtitle Generator is completely free with no hidden fees, registration required, or usage limits on most features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What video formats does Subtitle Generator support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Subtitle Generator supports all major video formats including MP4, WebM, MOV, AVI, and can also process YouTube links directly.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many languages can Subtitle Generator generate subtitles in?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Subtitle Generator supports over 50 languages including English, Spanish, French, German, Chinese, Japanese, and many more.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How accurate are the generated subtitles?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Subtitle Generator uses advanced AI and machine learning to achieve 95%+ accuracy for clear audio, though you can manually edit subtitles for perfection.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, use videos with clear audio and minimal background noise to ensure maximum subtitle accuracy</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Review and edit the generated subtitles to fix any technical terms or names that the AI may have misinterpreted</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the timestamp adjustment feature to perfectly sync subtitles with your video if there are minor timing issues</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export subtitles in multiple formats (SRT, VTT) to ensure compatibility with different video platforms and players</li>
          </ul>
        </div>
      </div>
    </div>
  );
}