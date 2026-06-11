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
  );
}