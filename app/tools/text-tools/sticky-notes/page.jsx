'use client';
import { useState } from 'react';

const COLORS = ['bg-yellow-300','bg-green-300','bg-blue-300','bg-pink-300','bg-purple-300','bg-orange-300'];

export default function StickyNotesPage() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [color, setColor] = useState('bg-yellow-300');

  const addNote = () => {
    if (!text.trim()) return;
    setNotes(prev => [...prev, { id: Date.now(), text, color }]);
    setText('');
  };

  const deleteNote = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Sticky Notes</h1>
        <p className="text-neutral-500 text-center mb-8">Create and manage sticky notes</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4 mb-6">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-24 resize-none" placeholder="Write your note here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={c + ' w-8 h-8 rounded-full ' + (color === c ? 'ring-2 ring-white' : '')} />
              ))}
            </div>
            <button onClick={addNote} disabled={!text.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-2 font-semibold transition">Add Note</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div key={note.id} className={note.color + ' rounded-xl p-4 text-neutral-900 relative'}>
              <button onClick={() => deleteNote(note.id)} className="absolute top-2 right-2 text-neutral-600 hover:text-neutral-900 font-bold">X</button>
              <p className="text-sm whitespace-pre-wrap pr-4">{note.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Sticky Notes</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Sticky Notes tool. No signup required, no watermark, works on all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Why use OnlineConverTools?</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>100% free — no hidden fees</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No signup or account required</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Files processed locally — your data stays private</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Works on all devices — desktop, tablet, mobile</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No watermarks added to your files</li>
          </ul>
        </div>
      </div>

  );
}