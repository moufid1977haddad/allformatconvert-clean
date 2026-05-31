'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', agree: false });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.agree) return;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-16 items-start">

          {/* Left side */}
          <div className="lg:w-2/5 pt-4">
            <h1 className="text-5xl font-extrabold text-neutral-900 dark:text-white mb-6 leading-tight">
              Contact
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed">
              Contact us if you want to report a bug, ask a question about AllFormatConvert, or get more information.
            </p>
          </div>

          {/* Right side — form */}
          <div className="lg:w-3/5 w-full">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📩</div>
                  <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">Message sent!</h2>
                  <p className="text-neutral-500 dark:text-neutral-400">Thank you for reaching out. We will get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Your name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="w-full border border-neutral-200 dark:border-neutral-600 rounded-lg px-4 py-2.5 text-sm text-neutral-800 dark:text-white bg-white dark:bg-neutral-700 focus:outline-none focus:border-red-400 dark:focus:border-red-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Your email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Your email"
                        className="w-full border border-neutral-200 dark:border-neutral-600 rounded-lg px-4 py-2.5 text-sm text-neutral-800 dark:text-white bg-white dark:bg-neutral-700 focus:outline-none focus:border-red-400 dark:focus:border-red-400 transition"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">📋</span>
                      <select
                        name="subject"
                        required
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full border border-neutral-200 dark:border-neutral-600 rounded-lg pl-9 pr-4 py-2.5 text-sm text-neutral-800 dark:text-white bg-white dark:bg-neutral-700 focus:outline-none focus:border-red-400 dark:focus:border-red-400 transition appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Select a subject...</option>
                        <option value="bug">Report a bug</option>
                        <option value="question">Ask a question</option>
                        <option value="feature">Feature request</option>
                        <option value="billing">Billing</option>
                        <option value="other">Other</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">▼</span>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      required
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Write a message"
                      rows={6}
                      className="w-full border border-neutral-200 dark:border-neutral-600 rounded-lg px-4 py-2.5 text-sm text-neutral-800 dark:text-white bg-white dark:bg-neutral-700 focus:outline-none focus:border-red-400 dark:focus:border-red-400 transition resize-none"
                    />
                  </div>

                  {/* Checkbox */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="agree"
                      id="agree"
                      checked={form.agree}
                      onChange={handleChange}
                      className="mt-0.5 w-4 h-4 accent-red-500 cursor-pointer flex-shrink-0"
                    />
                    <label htmlFor="agree" className="text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer leading-snug">
                      I accept the{' '}
                      <a href="/terms" className="text-red-500 hover:underline font-medium">terms and conditions</a>
                      {' '}and the{' '}
                      <a href="/privacy" className="text-red-500 hover:underline font-medium">privacy policy</a>
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!form.agree}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-8 py-3 rounded-lg transition"
                    >
                      Send message
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
