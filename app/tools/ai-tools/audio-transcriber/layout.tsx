import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Audio Transcriber — Convert Speech in an Audio File Online" },
  description: "Audio Transcriber is a free online tool that converts speech in an audio file into text using OpenAI's Whisper speech recognition model.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/audio-transcriber" },
  openGraph: {
    title: "Audio Transcriber — Convert Speech in an Audio File Online",
    description: "Audio Transcriber is a free online tool that converts speech in an audio file into text using OpenAI's Whisper speech recognition model.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/audio-transcriber",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
