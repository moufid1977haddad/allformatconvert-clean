'use client';
import { useState } from 'react';

export default function AIChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const process = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a helpful, friendly AI assistant. Answer questions and help with tasks in a conversational way.',
          prompt: userMsg,
        }),
      });
      const data = await response.json();
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
            {messages.length === 0 && <p className="text-neutral-400 text-sm text-center mt-8">Start a conversation...</p>}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-neutral-200 text-neutral-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white border border-neutral-200 rounded-xl px-4 py-2 text-sm text-neutral-400">Thinking...</div></div>}
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && process()} placeholder="Ask me anything..." className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
            <button onClick={process} disabled={!input.trim() || loading} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl px-5 py-2 font-semibold transition text-sm">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}