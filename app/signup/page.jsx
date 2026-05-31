'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SignUpPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-800 mb-2">Account created!</h2>
            <p className="text-neutral-500 text-sm mb-6">Welcome to AllFormatConvert. You can now sign in.</p>
            <Link href="/login" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition text-center">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-indigo-600">AllFormatConvert</Link>
          <h1 className="text-2xl font-bold text-neutral-800 mt-4">Create an account</h1>
          <p className="text-neutral-500 text-sm mt-1">Join thousands of users today</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
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
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirm"
                required
                value={form.confirm}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
