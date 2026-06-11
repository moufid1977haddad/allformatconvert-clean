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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Ai Chatbot</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">AI Chatbot is a free online tool that leverages artificial intelligence to provide instant responses and assistance for a wide range of queries and conversations. Whether you need quick answers, creative writing help, or general information, this intelligent chatbot is available 24/7 to support your needs.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Ai Chatbot</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the AI Chatbot website and locate the chat interface on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Type your question or message into the text input field at the bottom of the chat window</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Press Enter or click the Send button to submit your message to the AI</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Wait for the chatbot to process and generate a response, which will appear in the conversation thread above</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is AI Chatbot completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, AI Chatbot is completely free to use with no hidden charges or premium subscriptions required for basic functionality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use AI Chatbot?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account creation is required to start using AI Chatbot immediately, though creating an account allows you to save conversation history.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What types of questions can I ask the AI Chatbot?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can ask the chatbot a wide variety of questions including general knowledge, writing assistance, coding help, creative ideas, and more.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my conversation data stored and kept private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">AI Chatbot respects your privacy and follows data protection standards, with conversation data handled securely and not shared with third parties.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Be specific and detailed in your questions to receive more accurate and relevant responses from the chatbot</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use natural language as you would speak to a person, and the AI will understand and respond conversationally</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Break complex questions into smaller, simpler parts if you're not getting satisfactory answers on the first try</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark the tool for quick access and consider creating an account to maintain a history of your most useful conversations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}