import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Find and Replace — Find and Replace Text Online Free" },
  description: "Find Replace is a free online tool. No sign-up, no watermarks, no limits.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/find-replace" },
  openGraph: {
    title: "Find and Replace — Find and Replace Text Online Free",
    description: "Find Replace is a free online tool. No sign-up, no watermarks, no limits.",
    url: "https://www.onlineconvertools.com/tools/text-tools/find-replace",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/find-replace">{children}</ToolSeo>;
}
