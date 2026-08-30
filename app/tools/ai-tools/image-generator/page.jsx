'use client';
import SeoContent from '../../../components/SeoContent';
import { ToolIcon } from '../../../lib/toolIcons';
import { useSupabaseUser } from '@/lib/hooks/useSupabaseUser';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

function QuotaStatus({ bucket }) {
  const { user, loading } = useSupabaseUser();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const res = await fetch(`/api/quota/me?bucket=${bucket}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setBalance(await res.json());
    });
  }, [user, bucket]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
        <a href="/signin" className="font-bold underline">Log in</a> to use this tool once it launches — it's included free with an account, with a monthly limit.
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-600">
      {balance ? `${balance.remaining} / ${balance.cap} remaining this month` : 'Checking your balance…'}
    </div>
  );
}

export default function ImageGeneratorPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">AI Image Generator</h1>
        <p className="text-neutral-500 mb-10">Generate stunning images with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10 space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ToolIcon slug="image-generator" className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="text-indigo-500 text-xl font-bold">Coming Soon</div>
          <p className="text-neutral-500 text-sm mb-4">We are integrating advanced AI image generation. Stay tuned for updates!</p>
          <QuotaStatus bucket="images" />
        </div>
      </div>
      <SeoContent
        title="Image Generator"
        description="AI Image Generator is not yet available — this feature is under development. We're working on integrating AI-powered image generation so you'll be able to create images from a text description directly in your browser. Check back soon, or explore our other free AI tools in the meantime."
      />
    </div>
  );
}
