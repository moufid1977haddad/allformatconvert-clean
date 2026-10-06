import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Background Remover — Transparent PNG at Full Resolution" },
  description: "Remove the background from a photo and download a transparent PNG at its original size. Only a JPEG copy of 1,024 px at most goes to our own AI service.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/background-remover" },
  openGraph: {
    title: "Background Remover — Transparent PNG at Full Resolution",
    description: "Remove the background from a photo and download a transparent PNG at its original size. Only a JPEG copy of 1,024 px at most goes to our own AI service.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/background-remover",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/background-remover">{children}</ToolSeo>;
}
