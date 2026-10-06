'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import TextArea from '@/app/components/TextArea';
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
  // P25 (03/10, E6): passphrase mode, as Bitwarden and 1Password offer — EFF Large Wordlist (7,776 words, CC BY 3.0 US).
  // Bitwarden's options: 3-20 words (6 recommended since 2025), separator, capitalize, include a number.
  const [mode, setMode] = useState('password');
  const [words, setWords] = useState(6);
  const [separator, setSeparator] = useState('-');
  const [capitalize, setCapitalize] = useState(false);
  const [withNumber, setWithNumber] = useState(false);
  // Unbiased index in [0, n): rejection sampling on 32-bit values from the CSPRNG (a plain `v % n` favours low values).
  const randomIndex = (n) => {
    const limit = Math.floor(0x100000000 / n) * n;
    const buf = new Uint32Array(1);
    do crypto.getRandomValues(buf); while (buf[0] >= limit);
    return buf[0] % n;
  };
  const generatePassphrase = async () => {
    const { EFF_WORDS } = await import('../../../lib/effWordlist');
    const w = Math.min(20, Math.max(3, Math.round(Number(words)) || 6));
    const one = () => {
      const parts = Array.from({ length: w }, () => EFF_WORDS[randomIndex(EFF_WORDS.length)])
        .map((x) => (capitalize ? x.charAt(0).toUpperCase() + x.slice(1) : x));
      if (withNumber) { const i = randomIndex(w); parts[i] += String(randomIndex(10)); } // Bitwarden: one digit after one word
      return parts.join(separator);
    };
    const n = Math.min(50, Math.max(1, Math.round(Number(count)) || 1));
    const all = Array.from({ length: n }, one);
    setPassword(all[0]); setList(all);
    // log2(7776) ≈ 12.92 bits per word; the digit adds log2(10) for its value and log2(w) for the word it follows.
    setBits(Math.floor(w * Math.log2(EFF_WORDS.length) + (withNumber ? Math.log2(10 * w) : 0)));
  };
  const generate = () => {
    if (mode === 'passphrase') { generatePassphrase(); return; }
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
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type">
            {[['password', 'Password'], ['passphrase', 'Passphrase']].map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => { setMode(v); setPassword(''); setList([]); }} className={`rounded-lg border p-2 font-semibold ${mode === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-neutral-50 border-neutral-200'}`}>{label}</button>
            ))}
          </div>
          {mode === 'passphrase' ? (<>
          <div><label htmlFor="pp-words" className="block text-sm text-neutral-500 mb-1">Number of words: {words}</label><input id="pp-words" type="range" min="3" max="20" value={words} onChange={e => setWords(parseInt(e.target.value))} className="w-full" /></div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><span className="text-neutral-500">Word separator</span>
              <select id="pp-separator" value={separator} onChange={e => setSeparator(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg p-1">
                <option value="-">Hyphen ( - )</option><option value=" ">Space</option><option value=".">Period ( . )</option><option value="_">Underscore ( _ )</option><option value=",">Comma ( , )</option><option value="">None</option>
              </select></label>
            <label className="flex items-center gap-2"><input id="pp-capitalize" type="checkbox" checked={capitalize} onChange={e => setCapitalize(e.target.checked)} /> Capitalize</label>
            <label className="flex items-center gap-2"><input id="pp-number" type="checkbox" checked={withNumber} onChange={e => setWithNumber(e.target.checked)} /> Include a number</label>
          </div>
          </>) : (<>
          <div><label className="block text-sm text-neutral-500 mb-1">Length: {length}</label><input aria-label="Length" type="range" min="8" max="64" value={length} onChange={e => setLength(parseInt(e.target.value))} className="w-full" /></div>
          <div className="grid grid-cols-2 gap-3">
            {[['Uppercase', upper, setUpper],['Lowercase', lower, setLower],['Numbers', numbers, setNumbers],['Symbols', symbols, setSymbols]].map(([label, val, set]) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer bg-neutral-50 rounded-lg border border-neutral-200 p-3"><input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="w-4 h-4" /><span>{label}</span></label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><input id="pw-ambiguous" type="checkbox" checked={noAmbiguous} onChange={e => setNoAmbiguous(e.target.checked)} /> Avoid look-alike characters (0 O 1 l I |)</label>
          </div>
          </>)}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><span className="text-neutral-500">How many</span><input id="pw-count" type="number" min="1" max="50" value={count} onChange={e => setCount(e.target.value)} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-1" /></label>
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition text-white">{mode === 'passphrase' ? 'Generate Passphrase' : 'Generate Password'}</button>
          {password && <p className="text-center text-sm" data-entropy={bits}>Strength: about {bits} bits — {bits >= 100 ? 'excellent' : bits >= 80 ? 'very strong' : bits >= 60 ? 'strong' : bits >= 45 ? 'fair' : 'weak'}{bits < 60 ? ': make it longer' : ''}</p>}
          {mode === 'passphrase' && <p className="text-xs text-neutral-500 text-center">Words from the <a href="https://www.eff.org/dice" target="_blank" rel="noopener noreferrer" className="underline">EFF Large Wordlist</a> by the Electronic Frontier Foundation, used under <a href="https://creativecommons.org/licenses/by/3.0/us/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 3.0 US</a>.</p>}
          {list.length > 1 && <TextArea aria-label="Passwords" readOnly value={list.join('\n')} className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-xl p-3 font-mono text-sm" />}
          {password && <div className="space-y-2"><div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 font-mono text-center break-all text-indigo-400">{password}</div><button onClick={() => navigator.clipboard.writeText(password)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="Password Generator"
        description={"Password Generator makes random passwords from the character types you tick, or passphrases built from the EFF Large Wordlist (7,776 words), from 1 to 50 per click. Every character or word is drawn with crypto.getRandomValues, without the small bias of a plain modulo. Each ticked type appears at least once in a password, and an option removes look-alike characters (0 O 1 l I |). After each click the page estimates the strength in bits from the length and the size of the alphabet or word list. Nothing is saved: the results disappear when you reload."}
        example={{
          caption: "Two runs of the page’s generation code on 5 October 2026. Results are random each time, so never reuse these.",
          inputLabel: "Settings",
          input: "Password, Length: 16, all four types, Avoid look-alike characters\nPassphrase, Number of words: 6, Hyphen, Capitalize, Include a number",
          outputLabel: "Generated",
          output: "._]PrGBJ8M4ntD,m\nStrength: about 101 bits — excellent\n\nReliant0-Prowess-Commerce-Unseated-Decal-Diagnosis\nStrength: about 83 bits — very strong",
        }}
        howToTitle={"How to generate a strong password or passphrase"}
        howTo={[
          "Choose \"Password\" or \"Passphrase\" at the top.",
          "For a password, set \"Length\" and tick \"Uppercase\", \"Lowercase\", \"Numbers\" and \"Symbols\"; for a passphrase, set \"Number of words\", \"Word separator\", \"Capitalize\" and \"Include a number\".",
          "Optionally tick \"Avoid look-alike characters\" and enter a count in \"How many\".",
          "Click \"Generate Password\" or \"Generate Passphrase\", then \"Copy\" for the first result; when you made several, select them in the list box.",
        ]}
        specs={[
          { label: "Password length", value: "8 to 64 characters" },
          { label: "Passphrase", value: "3 to 20 words from the EFF Large Wordlist (7,776 words), five separators or none, optional capitals and digit" },
          { label: "Symbols used", value: "!@#$%^&*()_+-=[]{}|;:,.<>?" },
          { label: "Results per click", value: "1 to 50" },
          { label: "Strength labels", value: "Excellent from 100 bits, very strong from 80, strong from 60, fair from 45, weak below" },
        ]}
        privacyTitle={"Where your passwords are created"}
        privacy={"Passwords and passphrases are created in your browser with crypto.getRandomValues; they are never sent to our servers, logged or stored. The word list is part of the site’s code and loads the first time you generate a passphrase. Nothing is kept after a reload, so copy a password into your password manager before you leave."}
        faqs={[
          { q: "How many bits does a 6-word passphrase have?", a: "77 bits: each word drawn from the 7,776-word list adds about 12.9 bits, and 8 words give 103. With \"Include a number\", one digit placed after one random word adds a few bits more, for example 83 in total for six words." },
          { q: "Does every password contain each type I ticked?", a: "Yes. A password missing one of the ticked types is drawn again, so each selected type appears at least once, as sites with composition rules expect. Every password that qualifies stays equally likely." },
          { q: "What does Avoid look-alike characters remove?", a: "6 characters: zero, capital O, one, lowercase l, capital I and the vertical bar, which are easy to confuse in many fonts. The alphabet gets smaller, so the strength shown drops slightly for the same length." },
          { q: "Are generated passwords stored or logged?", a: "No. They exist only in the page while it is open: no request carries them to our servers, and a reload clears them. Copy a password before generating again, because a new click replaces the list." },
        ]}
        tips={[
          "For a master password you type by hand, a passphrase of six words gives 77 bits using only letters and the separator you pick.",
          "Need an identifier rather than a secret? UUID Generator makes random version 4 IDs.",
        ]}
      />
    </div>
  );
}