import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio Transcriber — Audio File to Text, SRT and VTT" },
  description: "Turn speech in an audio file into text with OpenAI Whisper, then copy it or download TXT, SRT or VTT subtitles with timings. No language to pick.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/audio-transcriber" },
  openGraph: {
    title: "Audio Transcriber — Audio File to Text, SRT and VTT",
    description: "Turn speech in an audio file into text with OpenAI Whisper, then copy it or download TXT, SRT or VTT subtitles with timings. No language to pick.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/audio-transcriber",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/audio-transcriber">{children}</ToolSeo>;
}
