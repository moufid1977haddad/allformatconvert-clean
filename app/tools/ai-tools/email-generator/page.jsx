'use client';
import { useState } from 'react';

const tones = ['Professional', 'Friendly', 'Formal', 'Casual', 'Persuasive'];

export default function EmailGeneratorPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tone, setTone] = useState('Professional');

  const process = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput('');
    setError('');
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are a professional email writer. Generate a well-structured ${tone.toLowerCase()} email based on the user description. Include subject line, greeting, body, and closing.`,
          prompt: input,
        }),
      });
      const data = await response.json();
      if (data.text) setOutput(data.text);
      else setError(data.error || 'No response received');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Email Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate professional emails with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Tone</label>
            <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm">
              {tones.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Describe the email you need..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Generating...' : 'Generate Email'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Email Generator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Email Generator is a free online tool that helps you create professional and personalized emails in seconds without any coding skills required. Whether you need business emails, newsletters, or promotional messages, this versatile tool streamlines your email writing process and saves you valuable time.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Email Generator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Email Generator website and select the type of email you want to create from the available templates</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Fill in the required fields such as recipient name, subject line, and main message content</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize the tone, style, and formatting options to match your brand or personal preference</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the generated email to your clipboard or download it as a file, then paste it into your email client</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Email Generator really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Email Generator is completely free with no hidden charges or premium subscriptions required for basic email generation features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use generated emails for business purposes?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely, the emails generated are fully customizable and suitable for both personal and professional business communications.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many emails can I generate per day?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">There are no daily limits on the number of emails you can generate, allowing unlimited usage for all users.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Email Generator?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account creation is necessary; you can start generating emails immediately without any registration or login requirements.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the template library to find pre-designed email formats that match your specific needs and save even more time</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Personalize generated emails with specific details about your recipient to increase engagement and response rates</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Review and edit the generated content before sending to ensure it aligns with your brand voice and messaging</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different tones and styles available in the tool to find the perfect fit for your communication goals</li>
          </ul>
        </div>
      </div>
    </div>
  );
}