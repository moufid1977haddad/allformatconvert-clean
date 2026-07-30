'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';

const COLORS = ['bg-yellow-300','bg-green-300','bg-blue-300','bg-pink-300','bg-purple-300','bg-orange-300'];
const STORAGE_KEY = 'sticky-notes';

export default function StickyNotesPage() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [color, setColor] = useState('bg-yellow-300');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setNotes(saved);
    } catch { /* ignore malformed storage */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes, loaded]);

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
      <SeoContent
        title="Sticky Notes"
        description="Sticky Notes lets you jot down quick colored notes right in your browser — no downloads or registration. Notes are saved to your browser's local storage automatically, so they're still there the next time you visit this page in the same browser. Note: storage is local to this browser only — there's no account, cloud sync, or cross-device access, and clearing your browser's site data will erase your notes."
        howTo={[
          "Type your note text into the text box.",
          "Pick a color from the six available swatches.",
          "Click \"Add Note\" to place it on the board — it's saved automatically.",
          "Click the \"X\" on any note to remove it."
        ]}
        faqs={[
          { q: "Are my notes saved?", a: "Yes — notes are automatically saved to your browser's local storage, so they persist across page refreshes and browser restarts on the same device and browser." },
          { q: "Can I access my notes on another device?", a: "No, there's no account or cloud sync — notes are stored locally in this specific browser, so they won't appear on other devices or browsers." },
          { q: "Can I share notes with others?", a: "No, there's no sharing or collaboration feature." },
          { q: "Is Sticky Notes free to use?", a: "Yes, it's completely free with no signup required." }
        ]}
        tips={[
          "Notes stay saved in this browser even after closing the tab or restarting your computer — no need to copy them out.",
          "Use different colors to visually group related notes while you work.",
          "Clearing your browser's cookies/site data or using a different browser or device will not show your saved notes — they're local to this one browser.",
          "For notes you need to sync across devices, use a dedicated cloud note-taking app instead."
        ]}
      />
    </div>
  );
}