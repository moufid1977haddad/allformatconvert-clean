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
  // P24 (03/10): Bitwarden's generator excludes look-alike characters and shows the strength; several at once too
  const [noAmbiguous, setNoAmbiguous] = useState(false);
  const [count, setCount] = useState(1);
  const [list, setList] = useState([]);
  const [bits, setBits] = useState(0);
  const generate = () => {
    const sets = [];
    const strip = (s) => (noAmbiguous ? s.replace(/[0O1lI|]/g, '') : s); // 0/O, 1/l/I/| look alike in many fonts
    if (upper) sets.push(strip('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
    if (lower) sets.push(strip('abcdefghijklmnopqrstuvwxyz'));
    if (numbers) sets.push(strip('0123456789'));
    if (symbols) sets.push(strip('!@#$%^&*()_+-=[]{}|;:,.<>?'));
    if (!sets.length) return;
    const chars = sets.join('');
    // crypto.getRandomValues is a CSPRNG, unlike Math.random(), which the Web Crypto
    // API docs explicitly warn is unsuitable for anything security-related.
    // Unbiased pick (rejection sampling: a plain `v % n` favours the first characters slightly).
    const limit = Math.floor(0x100000000 / chars.length) * chars.length;
    const pick = () => {
      const buf = new Uint32Array(1);
      do crypto.getRandomValues(buf); while (buf[0] >= limit);
      return chars[buf[0] % chars.length];
    };
    // Every selected kind appears at least once, as with Bitwarden and 1Password (a site that requires a digit would
    // otherwise reject some passwords). Drawn again until it does: every valid password stays equally likely.
    const one = () => { let pw; do pw = Array.from({ length }, pick).join(''); while (!sets.every((s) => [...pw].some((c) => s.includes(c)))); return pw; };
    const n = Math.min(50, Math.max(1, Math.round(Number(count)) || 1));
    const all = Array.from({ length: n }, one);
    setPassword(all[0]); setList(all);
    setBits(Math.floor(length * Math.log2(chars.length))); // entropy of a random pick from this alphabet
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Password Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate secure passwords</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Length: {length}</label><input aria-label="Length" type="range" min="8" max="64" value={length} onChange={e => setLength(parseInt(e.target.value))} className="w-full" /></div>
          <div className="grid grid-cols-2 gap-3">
            {[['Uppercase', upper, setUpper],['Lowercase', lower, setLower],['Numbers', numbers, setNumbers],['Symbols', symbols, setSymbols]].map(([label, val, set]) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer bg-neutral-50 rounded-lg border border-neutral-200 p-3"><input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="w-4 h-4" /><span>{label}</span></label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><input id="pw-ambiguous" type="checkbox" checked={noAmbiguous} onChange={e => setNoAmbiguous(e.target.checked)} /> Avoid look-alike characters (0 O 1 l I |)</label>
            <label className="flex items-center gap-2"><span className="text-neutral-500">How many</span><input id="pw-count" type="number" min="1" max="50" value={count} onChange={e => setCount(e.target.value)} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-1" /></label>
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition text-white">Generate Password</button>
          {password && <p className="text-center text-sm" data-entropy={bits}>Strength: about {bits} bits — {bits >= 100 ? 'excellent' : bits >= 80 ? 'very strong' : bits >= 60 ? 'strong' : bits >= 45 ? 'fair' : 'weak'}{bits < 60 ? ': make it longer' : ''}</p>}
          {list.length > 1 && <textarea aria-label="Passwords" readOnly value={list.join('\n')} className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-xl p-3 font-mono text-sm" />}
          {password && <div className="space-y-2"><div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 font-mono text-center break-all text-indigo-400">{password}</div><button onClick={() => navigator.clipboard.writeText(password)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="Password Generator"
        description="Password Generator builds a random password from the character sets you select, using the browser's crypto.getRandomValues() — a cryptographically secure random number source, not the predictable Math.random() — entirely in your browser. Nothing is uploaded to a server, and no generated password is stored or logged."
        howTo={[
          "Set your desired password length with the slider (8-64 characters).",
          "Toggle which character types to include: uppercase, lowercase, numbers, and symbols; optionally avoid look-alike characters and set how many passwords to make.",
          "Click 'Generate Password' to create a new password.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is Password Generator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How secure are the generated passwords?", a: "Characters are chosen using crypto.getRandomValues(), the Web Crypto API's cryptographically secure random source — the right choice for security-sensitive randomness, unlike Math.random()." },
          { q: "Can I customize length and character types?", a: "Yes — length ranges from 8 to 64 characters, and you can toggle uppercase, lowercase, numbers, and symbols independently." },
          { q: "Are generated passwords stored or logged?", a: "No, generation happens entirely in your browser and the password is never sent to or stored on a server." }
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