'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendState, setResendState] = useState('idle');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsConfirmation(false);
    setResendState('idle');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.code === 'email_not_confirmed' || /email not confirmed/i.test(error.message || '')) {
          setNeedsConfirmation(true);
          setError('Your email address is not confirmed yet. Please check your inbox (and spam folder) for the confirmation link.');
        } else if (error.name === 'AuthRetryableFetchError' || /failed to fetch/i.test(error.message || '')) {
          setError("We couldn't reach the server. Please check your connection and try again in a moment.");
        } else {
          setError(error.message);
        }
        setLoading(false);
      } else {
        router.push('/');
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
    if (!email) return;
    setResendState('sending');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      setResendState(error ? 'error' : 'sent');
    } catch {
      setResendState('error');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-indigo-600">OnlineConverTools</Link>
          <h1 className="text-2xl font-bold text-neutral-800 mt-4">Welcome back</h1>
          <p className="text-neutral-500 text-sm mt-1">Sign in to your account</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
              {needsConfirmation && (
                <div className="mt-2">
                  {resendState === 'sent' ? (
                    <span className="text-green-600 font-medium">Confirmation email resent — check your inbox.</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendState === 'sending'}
                      className="text-indigo-600 font-medium hover:underline disabled:text-neutral-400"
                    >
                      {resendState === 'sending' ? 'Resending…' : 'Resend confirmation email'}
                    </button>
                  )}
                  {resendState === 'error' && (
                    <p className="text-red-500 text-xs mt-1">Could not resend the email. Please try again later.</p>
                  )}
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input
                id="signin-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="signin-password" className="block text-sm font-medium text-neutral-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">Forgot password?</Link>
              </div>
              <input
                id="signin-password"
                name="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-neutral-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-indigo-600 font-medium hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
