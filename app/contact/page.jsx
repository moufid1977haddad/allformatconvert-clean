'use client';
import { useState, useRef } from 'react';
import { sniffFormat } from '../lib/detectFileFormat';
import {
  MAX_CONTACT_ATTACHMENT_BYTES, MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES, MAX_CONTACT_ATTACHMENTS_COUNT,
  CONTACT_ATTACHMENT_ACCEPTED_FORMATS, CONTACT_ATTACHMENT_ACCEPTED_LABEL,
} from '@/lib/quota/limits';

const MAX_ATTACHMENT_BYTES = MAX_CONTACT_ATTACHMENT_BYTES;
const MAX_ATTACHMENTS_TOTAL_BYTES = MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES;
const MAX_ATTACHMENTS_COUNT = MAX_CONTACT_ATTACHMENTS_COUNT;
const ACCEPTED_FORMATS = new Set(CONTACT_ATTACHMENT_ACCEPTED_FORMATS);
const ACCEPTED_LABEL = CONTACT_ATTACHMENT_ACCEPTED_LABEL;
const ATTACHMENT_HINT = `Up to ${MAX_ATTACHMENTS_COUNT} images (${ACCEPTED_LABEL}), ${(MAX_ATTACHMENT_BYTES / (1024 * 1024)).toFixed(0)} MB each, ${(MAX_ATTACHMENTS_TOTAL_BYTES / (1024 * 1024)).toFixed(0)} MB total. Click, drag & drop, or paste a screenshot.`;

function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [notified, setNotified] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', agree: false });
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();
  const nextFileId = useRef(0);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  // Client-side check only, for instant feedback -- the server re-validates
  // every one of these against the real bytes and is the actual security
  // boundary (see app/api/contact/route.js).
  async function addFiles(candidates) {
    setFileError('');
    const imageCandidates = candidates.filter((f) => f instanceof File);
    if (imageCandidates.length === 0) return;

    let currentCount = files.length;
    let currentTotal = files.reduce((sum, f) => sum + f.file.size, 0);
    const accepted = [];
    let rejectionReason = '';

    for (const file of imageCandidates) {
      if (currentCount >= MAX_ATTACHMENTS_COUNT) {
        rejectionReason = `You can attach up to ${MAX_ATTACHMENTS_COUNT} images.`;
        break;
      }
      if (file.size === 0 || file.size > MAX_ATTACHMENT_BYTES) {
        rejectionReason = `Each image must be ${formatBytes(MAX_ATTACHMENT_BYTES)} or smaller.`;
        continue;
      }
      if (currentTotal + file.size > MAX_ATTACHMENTS_TOTAL_BYTES) {
        rejectionReason = `Attachments can't add up to more than ${formatBytes(MAX_ATTACHMENTS_TOTAL_BYTES)} total.`;
        continue;
      }
      const buffer = await file.arrayBuffer();
      const detected = sniffFormat(buffer);
      if (!detected || !ACCEPTED_FORMATS.has(detected.format)) {
        rejectionReason = `Please attach ${ACCEPTED_LABEL} images only.`;
        continue;
      }
      accepted.push({ id: nextFileId.current++, file });
      currentCount += 1;
      currentTotal += file.size;
    }

    if (accepted.length > 0) setFiles((prev) => [...prev, ...accepted]);
    if (rejectionReason) setFileError(rejectionReason);
  }

  function removeFile(id) {
    setFileError('');
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  }

  function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items || []);
    const pastedFiles = items
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (pastedFiles.length > 0) {
      // Let normal text pasting through untouched; only intercept when the
      // clipboard actually carries an image (a textarea can't render one).
      e.preventDefault();
      addFiles(pastedFiles);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.agree) return;
    setError('');
    setLoading(true);

    try {
      const body = new FormData();
      body.append('name', form.name);
      body.append('email', form.email);
      body.append('subject', form.subject);
      body.append('message', form.message);
      for (const { file } of files) body.append('attachments', file);

      const res = await fetch('/api/contact', {
        method: 'POST',
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status >= 500) {
          setError("Our server had a problem sending your message. Please try again in a few minutes.");
        } else {
          setError(data.error || 'Something went wrong. Please check your information and try again.');
        }
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      setNotified(data.notified !== false);
      setSubmitted(true);
    } catch (err) {
      if (/failed to fetch/i.test(err?.message || '')) {
        setError("We couldn't reach the server. Please check your connection and try again in a moment.");
      } else {
        setError('Something went wrong. Please try again later.');
      }
      setLoading(false);
    }
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
              Contact us if you want to report a bug, ask a question about OnlineConverTools, or get more information.
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
                  {!notified && (
                    <p className="text-amber-600 dark:text-amber-400 text-sm mt-3">
                      Your message was saved, but our email notification didn't go through — replies may take a little longer than usual.
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                      {error}
                    </div>
                  )}

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
                      onPaste={handlePaste}
                      placeholder="Write a message"
                      rows={6}
                      className="w-full border border-neutral-200 dark:border-neutral-600 rounded-lg px-4 py-2.5 text-sm text-neutral-800 dark:text-white bg-white dark:bg-neutral-700 focus:outline-none focus:border-red-400 dark:focus:border-red-400 transition resize-none"
                    />
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Attachments (optional)
                    </label>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">{ATTACHMENT_HINT}</p>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition text-sm ${
                        dragOver
                          ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
                          : 'border-neutral-200 dark:border-neutral-600 hover:border-red-300'
                      }`}
                    >
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Click or drop images here
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; }}
                      />
                    </div>

                    {files.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {files.map(({ id, file }) => (
                          <li
                            key={id}
                            className="flex items-center justify-between text-xs bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-2"
                          >
                            <span className="truncate text-neutral-600 dark:text-neutral-300">
                              {file.name} <span className="text-neutral-400">({formatBytes(file.size)})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(id)}
                              aria-label={`Remove ${file.name}`}
                              className="text-neutral-400 hover:text-red-500 font-bold ml-3 flex-shrink-0"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {fileError && (
                      <p className="text-red-500 text-xs mt-2" role="alert">{fileError}</p>
                    )}
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
                      disabled={!form.agree || loading}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-8 py-3 rounded-lg transition"
                    >
                      {loading ? 'Sending...' : 'Send message'}
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
