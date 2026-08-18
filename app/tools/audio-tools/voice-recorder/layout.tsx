import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Voice Recorder — Capture Audio From Your Microphone Directly" },
  description: "Voice Recorder captures audio from your microphone directly in your browser using the MediaRecorder API — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/audio-tools/voice-recorder" },
  openGraph: {
    title: "Voice Recorder — Capture Audio From Your Microphone Directly",
    description: "Voice Recorder captures audio from your microphone directly in your browser using the MediaRecorder API — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/audio-tools/voice-recorder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
