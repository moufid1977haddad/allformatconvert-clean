import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image Captioner — AI Caption for a Photo or Picture" },
  description: "Upload a photo and get a descriptive caption from GPT-4o mini vision. Large photos are reduced on your device before upload; copy or save the caption.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/image-captioner" },
  openGraph: {
    title: "Image Captioner — AI Caption for a Photo or Picture",
    description: "Upload a photo and get a descriptive caption from GPT-4o mini vision. Large photos are reduced on your device before upload; copy or save the caption.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/image-captioner",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/image-captioner">{children}</ToolSeo>;
}
