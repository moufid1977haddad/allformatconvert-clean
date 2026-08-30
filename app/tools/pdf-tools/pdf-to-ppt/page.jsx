'use client';
import Link from 'next/link';
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

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">
          Back to PDF Tools
        </Link>
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">PDF to PowerPoint</h1>
        <p className="text-neutral-500 mb-10">Convert PDF to editable PowerPoint presentation</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10 space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ToolIcon slug="pdf-to-ppt" className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-indigo-500 text-xl font-bold">Coming Soon</div>
          <p className="text-neutral-500 text-sm mb-4">We are working hard to bring you this tool. Stay tuned!</p>
          <QuotaStatus bucket="pdf_conversions" />
        </div>
      </div>
      <SeoContent
        title="PDF to PowerPoint"
        description="A tool to convert a PDF into an editable PowerPoint presentation is not yet available — this feature is under development. Check back soon, or explore our other PDF tools in the meantime."
      />
    </div>
  );
}