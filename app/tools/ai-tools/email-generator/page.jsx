'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';

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
      const lengthCheck = checkPromptLength(input);
      if (!lengthCheck.ok) { setError(lengthCheck.message); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are a professional email writer. Generate a well-structured ${tone.toLowerCase()} email based on the user description. Include subject line, greeting, body, and closing.`,
          prompt: input,
          tool: 'email-generator',
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
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
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
      <SeoContent
        title="Email Generator"
        description="Email Generator is a free online tool that uses OpenAI's GPT-4o mini model to draft a complete email — subject line, greeting, body, and closing — from a short description and a chosen tone. It saves time on routine business emails, follow-ups, and messages without requiring any writing from scratch."
        howTo={[
          "Select a tone for your email — Professional, Friendly, Formal, Casual, or Persuasive.",
          "Describe the email you need in the input field.",
          "Click the 'Generate Email' button to send your description to the AI.",
          "Copy the generated email to your clipboard and paste it into your email client."
        ]}
        faqs={[
          { q: "Is Email Generator really free to use?", a: "Yes, Email Generator is free to use with no signup or subscription required." },
          { q: "Can I use generated emails for business purposes?", a: "Yes, the emails generated are suitable for both personal and professional business communications." },
          { q: "Does Email Generator offer templates I can pick from?", a: "No, there's no template library — you describe the email you need in your own words and choose a tone, and the AI writes a full draft from that." },
          { q: "Do I need to create an account to use Email Generator?", a: "No account is necessary; you can start generating emails immediately." }
        ]}
        tips={[
          "Include key details like the recipient, purpose, and any specific points you want covered in your description.",
          "Try a different tone if the first draft doesn't match the voice you're going for.",
          "Review and edit the generated content before sending to make sure it matches your intent.",
          "Personalize the draft with specific details about your recipient to increase engagement."
        ]}
      />
    </div>
  );
}