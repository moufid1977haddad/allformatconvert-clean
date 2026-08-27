'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SiteName from '@/app/components/SiteName';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState('checking'); // checking | ready | invalid | success
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const urlError = params.get('error_code') || hashParams.get('error_code');
    if (urlError) {
      setStatus('invalid');
      return;
    }

    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolved = true;
        setStatus('ready');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!resolved && session) {
        resolved = true;
        setStatus('ready');
      } else if (!resolved) {
        setTimeout(() => {
          if (!resolved) setStatus('invalid');
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        await supabase.auth.signOut();
        setStatus('success');
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

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <p className="text-neutral-500 text-sm">Verifying your link...</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10">
            <h2 className="text-xl font-bold text-neutral-800 mb-2">This link is invalid or has expired</h2>
            <p className="text-neutral-500 text-sm mb-6">Password reset links can only be used once and expire after a while. Request a new one.</p>
            <Link href="/forgot-password" className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition text-center">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-800 mb-2">Password updated</h2>
            <p className="text-neutral-500 text-sm mb-6">Your password has been changed. Sign in with your new password.</p>
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
          <Link href="/"><SiteName className="font-semibold text-2xl text-black dark:text-white" /></Link>
          <h1 className="text-2xl font-bold text-neutral-800 mt-4">Set a new password</h1>
          <p className="text-neutral-500 text-sm mt-1">Choose a new password for your account</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-password" className="block text-sm font-medium text-neutral-700 mb-1">New Password</label>
              <input
                id="reset-password"
                name="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label htmlFor="reset-confirm" className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
              <input
                id="reset-confirm"
                name="confirm"
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
