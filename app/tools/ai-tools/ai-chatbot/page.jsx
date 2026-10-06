'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { readAiJson, chatPrompt } from '../../../lib/aiClient';
import { useToolError } from '../../../lib/useToolError';

export default function AIChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');

  const process = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    const history = messages; // the turns shown so far, sent with the new message (lib/aiClient.js)
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setError('');
    try {
      const lengthCheck = checkPromptLength(userMsg);
      if (!lengthCheck.ok) { setError(lengthCheck.message); setLoading(false); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: chatPrompt(history, userMsg, MAX_PROMPT_CHARS),
          tool: 'ai-chatbot',
        }),
      });
      const data = await readAiJson(response);
      if (data.text) setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
      else setError(data.error || 'No response received');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">AI Chatbot</h1>
        <p className="text-neutral-500 text-center mb-8">Chat with an AI assistant</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="h-80 overflow-y-auto space-y-3 bg-neutral-50 rounded-xl p-4">
            {messages.length === 0 && <p className="text-neutral-500 text-sm text-center mt-8">Start a conversation...</p>}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md whitespace-pre-wrap break-words rounded-xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-neutral-200 text-neutral-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white border border-neutral-200 rounded-xl px-4 py-2 text-sm text-neutral-400">Thinking...</div></div>}
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && process()} placeholder="Ask me anything..." className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            <button onClick={process} disabled={!input.trim() || loading} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl px-5 py-2 font-semibold transition text-sm">
              Send
            </button>
          </div>
        </div>
      </div>
      <SeoContent
        title="AI Chatbot"
        description={`AI Chatbot is a plain chat window for asking questions, drafting short texts or talking an idea through with OpenAI's GPT-4o mini model. Each message goes to our server together with the most recent turns of the conversation, so a follow-up such as "and its population?" is understood. The whole request is capped at ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters, and the oldest turns are dropped first when a chat grows long. The reply appears once it is complete, not word by word. Nothing is saved: the conversation lives only in this page and disappears when you reload it, and there is no download button.`}
        howToTitle="How to chat with the AI"
        howTo={[
          "Type your question in the \"Ask me anything...\" field.",
          "Press Enter or click \"Send\".",
          "Wait while \"Thinking...\" is shown; the full reply then appears under your message.",
          "Ask follow-up questions in the same chat, or reload the page to start a new conversation."
        ]}
        specs={[
          { label: "Input", value: "Text you type, one message at a time" },
          { label: "Request length", value: `Up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters, including the earlier turns sent with your message` },
          { label: "Reply length", value: "At most 1,000 tokens; a longer answer is cut off" },
          { label: "Model", value: "OpenAI GPT-4o mini, reached through our server" },
          { label: "Usage limits", value: "Your connection has an hourly and a daily allowance shared with the site's other paid tools, and the site has a monthly budget; the chat tells you when one is reached" }
        ]}
        privacyTitle="Where your messages are processed"
        privacy="Your message, together with the recent turns of the chat, is sent to our server and passed to OpenAI, which writes the reply. We keep no copy of the conversation. Our database records which tool was used, whether the call worked and what it cost, plus a request count per connection, filed under a hashed IP address, that applies the hourly and daily limits."
        faqs={[
          { q: "Does the chatbot remember what I said earlier?", a: `Yes, within this page. Each message is sent with as many recent turns as fit in the ${MAX_PROMPT_CHARS.toLocaleString('en-US')}-character limit, newest first, so short follow-up questions work. In a long chat the oldest turns are left out, and reloading the page starts again from nothing.` },
          { q: "Is my chat history saved anywhere?", a: "No. The conversation exists only in this browser tab. It is not stored in an account or on our server, so reloading or closing the page erases it. Copy any reply you want to keep before you leave the page." },
          { q: "Is there a limit on how much I can chat?", a: "Yes. Every reply is a paid request to OpenAI, so each connection gets an hourly and a daily number of requests, counted together with the site's other paid tools, and the site has a monthly budget. The message says when you can try again." },
          { q: "Can the chatbot's answers be wrong?", a: "Yes. Replies are written by a language model and can contain mistakes or outdated facts, and this chatbot does not search the web. Check anything important, such as figures, dates or quotes, against a reliable source before you rely on it." }
        ]}
        tips={[
          "When you change topic, reload the page so the previous turns are not sent along with your new question.",
          "To translate, summarize or reword a long text, AI Translator, Text Summarizer and AI Paraphraser return only the result and offer a .txt download."
        ]}
      />
    </div>
  );
}