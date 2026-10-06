import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Voice Recorder — Record, Pause, Save as M4A, MP3 or WAV" },
  description: "Record your microphone in the browser with pause and resume, then download it as recorded (M4A or WebM) or export it to MP3 at 192 kbps or to WAV.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/voice-recorder" },
  openGraph: {
    title: "Voice Recorder — Record, Pause, Save as M4A, MP3 or WAV",
    description: "Record your microphone in the browser with pause and resume, then download it as recorded (M4A or WebM) or export it to MP3 at 192 kbps or to WAV.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/voice-recorder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/audio-tools/voice-recorder">{children}</ToolSeo>;
}
