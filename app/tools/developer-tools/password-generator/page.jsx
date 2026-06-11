'use client';
import { useState } from 'react';
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
    setPassword(Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Password Generator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Password Generator is a free online tool that creates strong, random passwords to help protect your accounts and personal information from cyber threats. Simply customize your preferences and instantly generate secure passwords that meet industry security standards.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Password Generator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Password Generator tool and select your desired password length using the slider or input field.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose which character types to include such as uppercase letters, lowercase letters, numbers, and special symbols.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the Generate button to create a random password based on your specifications.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the generated password to your clipboard and use it for your account registration or password change.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the Password Generator tool really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Password Generator is completely free with no hidden charges, subscriptions, or registration required.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How secure are the passwords generated by this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool generates cryptographically random passwords using modern security algorithms, making them extremely difficult to crack or guess.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I customize the password length and character types?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can adjust the password length and select which character types to include such as numbers, symbols, and uppercase or lowercase letters.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Are my generated passwords stored or tracked?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, the tool does not store, log, or track any passwords you generate. All generation happens locally in your browser for complete privacy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use longer passwords of at least 16 characters for critical accounts like email and banking to maximize security.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Include a mix of uppercase letters, lowercase letters, numbers, and special symbols to create stronger passwords.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Generate a new password for each online account you create to prevent multiple account compromises if one password is leaked.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Store your generated passwords in a trusted password manager rather than writing them down or saving them in plain text files.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}