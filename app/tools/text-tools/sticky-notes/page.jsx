'use client';
import { useState, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import TextArea from '@/app/components/TextArea';

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
      // A malformed note (edited storage, older version) is skipped instead of crashing the page (plan, bloquant 11).
      if (Array.isArray(saved)) setNotes(saved.filter((n) => n && typeof n === 'object' && typeof n.text === 'string' && (typeof n.id === 'number' || typeof n.id === 'string')).map((n) => ({ ...n, color: typeof n.color === 'string' ? n.color : 'bg-yellow-300' })));
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
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-24 resize-none" placeholder="Write your note here..." value={text} onChange={e => setText(e.target.value)} />
          {/* wraps on a phone: the colour buttons are 44 px touch targets there (P21) */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} aria-label={'Note colour: ' + c.replace('bg-', '').replace('-300', '')} aria-pressed={color === c} className={c + ' w-8 h-8 rounded-full ' + (color === c ? 'ring-2 ring-white' : '')} />
              ))}
            </div>
            <button onClick={addNote} disabled={!text.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-2 font-semibold transition text-white">Add Note</button>
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
        description={"Sticky Notes puts short text notes on a colored board, for a to-do list, phone numbers or reminders while you work. Each note keeps its line breaks and takes one of six colors: yellow, green, blue, pink, purple or orange. Notes are saved automatically in the local storage of this browser and come back when you reopen the page in the same browser, unless Safari has cleared them: it deletes the storage of a site you have not opened during seven days of browsing. There is no account and no sync: notes cannot be edited, moved, exported or shared, and they exist on this device only."}
        example={{
          caption: "What this page stores after you add one yellow note: the key sticky-notes in local storage. The id is the time the note was added.",
          inputLabel: "Note (color: yellow)",
          input: "Call the plumber\nbefore 5 pm",
          outputLabel: "Stored in local storage",
          output: "[{\"id\":1759700000000,\"text\":\"Call the plumber\\nbefore 5 pm\",\"color\":\"bg-yellow-300\"}]",
        }}
        howToTitle={"How to add a sticky note"}
        howTo={[
          "Type your note in the box; line breaks are kept.",
          "Pick a color among the six round buttons; yellow is selected at first.",
          "Click \"Add Note\"; the note appears on the board and is saved at once.",
          "Click the X of a note to delete it; there is no confirmation and no undo."
        ]}
        specs={[
          { label: "Storage", value: "This browser's local storage, under the key sticky-notes" },
          { label: "Colors", value: "Yellow, green, blue, pink, purple, orange" },
          { label: "Editing", value: "None: delete a note and add it again to change it" },
          { label: "Devices", value: "One browser on one device; a private window loses its notes when it closes" }
        ]}
        privacyTitle={"Where your notes are kept"}
        privacy={"Your notes are written to local storage on this device by the page itself. They are never uploaded and no copy exists on our side, so we cannot restore them. Clearing the data of this site, closing a private window, or not opening this page in Safari for seven days of browsing deletes them for good."}
        faqs={[
          { q: "Will my notes still be here tomorrow?", a: "Yes, in the same browser on the same device, as long as you do not clear the data of this site. In a private or incognito window the browser erases local storage when the window closes, so those notes disappear." },
          { q: "Can I open my notes on my phone or another computer?", a: "No. Notes live in the local storage of the browser that created them; there is no account and no cloud copy. To move a note, copy its text by hand and add it again on the other device." },
          { q: "Can I edit a note after adding it?", a: "No. A note can only be deleted with its X button. To change one, copy its text into the box, edit it, click \"Add Note\", then delete the old note." }
        ]}
        tips={[
          "Give each project or person its own color, since notes cannot be renamed, grouped or reordered."
        ]}
      />
    </div>
  );
}