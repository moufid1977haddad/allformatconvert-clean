'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const generate = () => {
    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) return;
    // crypto.getRandomValues is a CSPRNG, unlike Math.random(), which the Web Crypto
    // API docs explicitly warn is unsuitable for anything security-related.
    const randomValues = crypto.getRandomValues(new Uint32Array(length));
    setPassword(Array.from(randomValues, v => chars[v % chars.length]).join(''));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Password Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate secure passwords</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Length: {length}</label><input type="range" min="8" max="64" value={length} onChange={e => setLength(parseInt(e.target.value))} className="w-full" /></div>
          <div className="grid grid-cols-2 gap-3">
            {[['Uppercase', upper, setUpper],['Lowercase', lower, setLower],['Numbers', numbers, setNumbers],['Symbols', symbols, setSymbols]].map(([label, val, set]) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer bg-neutral-50 rounded-lg border border-neutral-200 p-3"><input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="w-4 h-4" /><span>{label}</span></label>
            ))}
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate Password</button>
          {password && <div className="space-y-2"><div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 font-mono text-center break-all text-indigo-400">{password}</div><button onClick={() => navigator.clipboard.writeText(password)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="Password Generator"
        description="Password Generator builds a random password from the character sets you select, using the browser's crypto.getRandomValues() — a cryptographically secure random number source, not the predictable Math.random() — entirely in your browser. Nothing is uploaded to a server, and no generated password is stored or logged."
        howTo={[
          "Set your desired password length with the slider (8-64 characters).",
          "Toggle which character types to include: uppercase, lowercase, numbers, and symbols.",
          "Click 'Generate Password' to create a new password.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is Password Generator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How secure are the generated passwords?", a: "Characters are chosen using crypto.getRandomValues(), the Web Crypto API's cryptographically secure random source — the right choice for security-sensitive randomness, unlike Math.random()." },
          { q: "Can I customize length and character types?", a: "Yes — length ranges from 8 to 64 characters, and you can toggle uppercase, lowercase, numbers, and symbols independently." },
          { q: "Are generated passwords stored or logged?", a: "No, generation happens entirely in your browser and nothing is sent to or stored on a server." }
        ]}
        tips={[
          "Use at least 16 characters with all four character types enabled for the strongest passwords on important accounts.",
          "Generate a unique password for every account so a single leak doesn't compromise others.",
          "Store generated passwords in a password manager rather than writing them down or reusing them from memory.",
          "Copy the password immediately after generating it, since it isn't saved anywhere once you navigate away."
        ]}
      />
    </div>
  );
}