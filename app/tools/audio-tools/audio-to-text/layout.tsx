import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Audio to Text — Transcribe a File or Live Dictation" },
  description: "Turn speech into text two ways: dictate live through your browser's speech recognition, or send a recording to OpenAI Whisper for TXT, SRT or VTT.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/audio-to-text" },
  openGraph: {
    title: "Audio to Text — Transcribe a File or Live Dictation",
    description: "Turn speech into text two ways: dictate live through your browser's speech recognition, or send a recording to OpenAI Whisper for TXT, SRT or VTT.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/audio-to-text",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/audio-to-text">{children}</ToolSeo>;
}
