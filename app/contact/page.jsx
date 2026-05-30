'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-xl mx-auto">

        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">Contact Us</h1>
        <p className="text-neutral-500 text-center mb-10">Have a question or feedback? We would love to hear from you.</p>

        <div className="bg-white border border-neutral-200 rounded-xl p-8">
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">ðŸ“©</div>
              <h2 className="text-xl font-bold text-neutral-800 mb-2">Message sent!</h2>
              <p className="text-neutral-500 text-sm">Thank you for reaching out. We will get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm text-neutral-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm text-neutral-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                <textarea
                  name="message"
                  required
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  rows={5}
                  className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm text-neutral-800 focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-lg transition"
              >
                Send Message
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}