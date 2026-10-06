import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Tools: Writing, Translation, AI Detection, Transcription" },
  description: "16 AI tools to write, translate, detect AI text, cut out photos, upscale images and transcribe audio, free within hourly and daily limits.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools" },
  openGraph: {
    title: "AI Tools: Writing, Translation, AI Detection, Transcription",
    description: "16 AI tools to write, translate, detect AI text, cut out photos, upscale images and transcribe audio, free within hourly and daily limits.",
    url: "https://www.onlineconvertools.com/tools/ai-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
