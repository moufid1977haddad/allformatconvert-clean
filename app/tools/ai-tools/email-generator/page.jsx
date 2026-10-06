'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { readAiJson } from '../../../lib/aiClient';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

const tones = ['Professional', 'Friendly', 'Formal', 'Casual', 'Persuasive'];

export default function EmailGeneratorPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const [tone, setTone] = useState('Professional');

  const process = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput('');
    setError('');
    try {
      const lengthCheck = checkPromptLength(input);
      if (!lengthCheck.ok) { setError(lengthCheck.message); setLoading(false); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          tool: 'email-generator',
          options: { tone },
        }),
      });
      const data = await readAiJson(response);
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
            <select aria-label="Tone" value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm">
              {tones.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Describe the email you need..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Generating...' : 'Generate Email'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <TextDownload text={output} name="email.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Email Generator"
        description={`Email Generator writes a complete email from a short description: subject line, greeting, body and closing. You choose one of ${tones.length} tones (${tones.join(', ')}) and describe who the email is for and what it must say. The description is sent through our server to OpenAI's GPT-4o mini model, and the draft comes back as plain text to paste into your mail app or download as email.txt. The tool does not send email, does not connect to your inbox and has no template library.`}
        howToTitle="How to generate an email with AI"
        howTo={[
          "Pick a tone in the \"Tone\" list: \"Professional\", \"Friendly\", \"Formal\", \"Casual\" or \"Persuasive\".",
          "Describe the email in the \"Describe the email you need...\" box: recipient, purpose and the points to cover.",
          "Click \"Generate Email\" and wait while it shows \"Generating...\".",
          "Click \"Copy\" and paste the draft into your email app, or \"Download\" it as email.txt."
        ]}
        specs={[
          { label: "Tones", value: tones.join(', ') },
          { label: "Output", value: "Subject line, greeting, body and closing, as plain text" },
          { label: "Description length", value: `Up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters` },
          { label: "Usage limits", value: "An hourly and a daily allowance per connection, shared with the site's other paid tools, plus a monthly budget for the site" }
        ]}
        privacyTitle="Where your request is processed"
        privacy="The tone you pick and your description go to our server, which passes them to OpenAI's GPT-4o mini to write the email. Nothing is sent to any recipient, and we keep neither your description nor the draft. Leave passwords and account numbers out of the description."
        faqs={[
          { q: "Does it send the email for me?", a: "No. It only writes a draft. Copy it into Gmail, Outlook or any mail app, check names, dates and figures, and send it from there. The page never connects to an email account." },
          { q: "Does the tone change anything else?", a: "No. Only the tone word in the instruction the model receives changes, for example formal or persuasive; everything else stays the same. Generate the same description in two tones to compare them, since each click produces a new draft." },
          { q: "How much can I write in the description?", a: `${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters. A few lines with the recipient, the purpose, the key facts and the action you expect are usually enough; a longer description is refused before anything is sent.` }
        ]}
        tips={[
          "Put the facts the email must contain, such as dates, amounts and names, in the description: the model cannot know them otherwise.",
          "To polish an email you wrote yourself, paste it into Grammar Fixer instead of generating a new one."
        ]}
      />
    </div>
  );
}