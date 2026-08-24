'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingUnconfirmed, setExistingUnconfirmed] = useState(false);
  const [error, setError] = useState('');
  const [resendState, setResendState] = useState('idle');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name },
          emailRedirectTo: `${window.location.origin}/signin`,
        }
      });

      if (error) {
        if (error.name === 'AuthRetryableFetchError' || /failed to fetch/i.test(error.message || '')) {
          setError("We couldn't reach the server. Please check your connection and try again in a moment.");
        } else {
          setError(error.message);
        }
        setLoading(false);
      } else if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Please sign in instead.');
        setLoading(false);
      } else if (data?.user && Date.now() - new Date(data.user.created_at).getTime() > 10000) {
        // Supabase returns a "success" response for a duplicate signup on an
        // unconfirmed account too, but silently keeps the original password.
        setExistingUnconfirmed(true);
        setLoading(false);
      } else {
        setSuccess(true);
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

  const handleResend = async () => {
    if (!form.email) return;
    setResendState('sending');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: form.email,
        options: { emailRedirectTo: `${window.location.origin}/signin` },
      });
      setResendState(error ? 'error' : 'sent');
    } catch {
      setResendState('error');
    }
  };

  if (existingUnconfirmed) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10">
            <h2 className="text-xl font-bold text-neutral-800 mb-2">This email is already pending confirmation</h2>
            <p className="text-neutral-600 text-sm mb-1">
              An account for <span className="font-medium">{form.email}</span> was already created but not confirmed yet.
            </p>
            <p className="text-neutral-500 text-sm mb-4">
              For security, the password you just entered was <span className="font-medium">not</span> saved — the account still uses the password from when it was first created.
            </p>
            <div className="mb-6 space-y-2">
              {resendState === 'sent' ? (
                <p className="text-green-600 text-sm font-medium">Confirmation email resent — check your inbox.</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === 'sending'}
                  className="text-indigo-600 text-sm font-medium hover:underline disabled:text-neutral-400 block w-full"
                >
                  {resendState === 'sending' ? 'Resending…' : 'Resend the confirmation email'}
                </button>
              )}
              {resendState === 'error' && (
                <p className="text-red-500 text-xs">Could not resend the email. Please try again later.</p>
              )}
              <p className="text-neutral-400 text-xs pt-1">
                Don't remember the original password?{' '}
                <Link href="/forgot-password" className="text-indigo-600 hover:underline">Reset it</Link> — this also confirms your email.
              </p>
            </div>
            <Link href="/signin" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition text-center">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-bold text-neutral-800 mb-2">Account created! 🎉</h2>
            <p className="text-neutral-500 text-sm mb-2">Welcome to OnlineConverTools.</p>
            <p className="text-neutral-600 text-sm mb-1">
              We sent a confirmation link to <span className="font-medium">{form.email}</span>.
            </p>
            <p className="text-neutral-400 text-xs mb-1">Please check your inbox — and your spam folder — and confirm your address before signing in.</p>
            <p className="text-neutral-400 text-xs mb-4">Using iCloud or Yahoo Mail? If it lands in Junk, please mark it "Not Junk" — it helps make sure our emails reach you (and others) reliably in the future.</p>
            <div className="mb-6">
              {resendState === 'sent' ? (
                <span className="text-green-600 text-sm font-medium">Confirmation email resent — check your inbox.</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === 'sending'}
                  className="text-indigo-600 text-sm font-medium hover:underline disabled:text-neutral-400"
                >
                  {resendState === 'sending' ? 'Resending…' : "Didn't get the email? Resend it"}
                </button>
              )}
              {resendState === 'error' && (
                <p className="text-red-500 text-xs mt-1">Could not resend the email. Please try again later.</p>
              )}
            </div>
            <Link href="/signin" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition text-center">
              Go to Sign In
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
          <h1 className="text-2xl font-bold text-neutral-800 mt-4">Create an account</h1>
          <p className="text-neutral-500 text-sm mt-1">Join thousands of users today</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
              <input
                type="text" name="name" required value={form.name} onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input
                type="email" name="email" required value={form.email} onChange={handleChange}
                placeholder="your@email.com"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
              <input
                type="password" name="password" required value={form.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
              <input
                type="password" name="confirm" required value={form.confirm} onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link href="/signin" className="text-indigo-600 font-medium hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
