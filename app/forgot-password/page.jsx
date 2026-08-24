'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.name === 'AuthRetryableFetchError' || /failed to fetch/i.test(error.message || '')) {
          setError("We couldn't reach the server. Please check your connection and try again in a moment.");
        } else {
          setError(error.message);
        }
        setLoading(false);
      } else {
        setSent(true);
        setLoading(false);
      }
    } catch (err) {
      if (/failed to fetch/i.test(err?.message || '')) {
        setError("We couldn't reach the server. Please check your connection and try again in a moment.");
      } else {
        setError('Something went wrong. Please try again later.');
      }
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-800 mb-2">Check your inbox</h2>
            <p className="text-neutral-600 text-sm mb-1">
              If an account exists for <span className="font-medium">{email}</span>, we sent a link to reset your password.
            </p>
            <p className="text-neutral-400 text-xs mb-6">Check your spam folder if it doesn't show up in a few minutes.</p>
            <Link href="/signin" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition text-center">
              Back to Sign In
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
          <Link href="/" className="text-2xl font-bold text-indigo-600">OnlineConverTools</Link>
          <h1 className="text-2xl font-bold text-neutral-800 mt-4">Reset your password</h1>
          <p className="text-neutral-500 text-sm mt-1">We'll email you a link to set a new one</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-neutral-500">
            Remembered your password?{' '}
            <Link href="/signin" className="text-indigo-600 font-medium hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
