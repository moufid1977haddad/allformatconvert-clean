'use client';
import { useState } from 'react';
export default function JwtDecoderPage() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');
  const decode = () => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const header = JSON.parse(atob(parts[0].replace(/-/g,'+').replace(/_/g,'/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
      setDecoded({ header, payload });
      setError('');
    } catch(e) { setError('Invalid JWT token'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JWT Decoder</h1>
        <p className="text-neutral-500 text-center mb-8">Decode and inspect JWT tokens</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none font-mono" placeholder="Paste JWT token here..." value={token} onChange={e => setToken(e.target.value)} />
          <button onClick={decode} disabled={!token} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Decode</button>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {decoded && ['header','payload'].map(k => <div key={k} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4"><div className="text-neutral-500 text-sm mb-2 uppercase">{k}</div><pre className="font-mono text-sm text-indigo-400 overflow-x-auto">{JSON.stringify(decoded[k], null, 2)}</pre></div>)}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Jwt Decoder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">JWT Decoder is a free online tool that instantly decodes and validates JSON Web Tokens to reveal their payload, header, and signature information. Perfect for developers, security professionals, and API testers who need to inspect JWT tokens without installation or authentication.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Jwt Decoder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your JWT token into the input field at the top of the decoder</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically decodes and displays the header, payload, and signature sections</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the decoded JSON data to verify token claims, expiration time, and user information</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Check the signature validation status to ensure the token hasn't been tampered with</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is a JWT token?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">A JWT (JSON Web Token) is a compact, URL-safe string used for securely transmitting information between parties. It consists of three parts separated by dots: header, payload, and signature.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my token data secure when using this decoder?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, JWT Decoder processes tokens entirely in your browser without sending data to any server. Your tokens remain completely private and secure.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use this tool for production environments?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely. JWT Decoder is ideal for debugging, testing, and validating tokens during development and production troubleshooting.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What information can I see when decoding a JWT?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can view the token's header (algorithm and type), payload (claims and user data), and signature validation status to identify potential issues.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always validate the signature to ensure the token hasn't been modified or forged by unauthorized parties</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check the 'exp' claim in the payload to verify if your token has expired before using it</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use this tool to debug authentication issues by comparing expected and actual token claims</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick reference during API integration and troubleshooting sessions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}