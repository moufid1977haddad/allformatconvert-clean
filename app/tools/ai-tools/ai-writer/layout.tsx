import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Writer — Use Openai's Gpt-4o Mini Model Online Free" },
  description: "AI Writer is a free online tool that uses OpenAI's GPT-4o mini model to generate written content from a simple description.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-writer" },
  openGraph: {
    title: "AI Writer — Use Openai's Gpt-4o Mini Model Online Free",
    description: "AI Writer is a free online tool that uses OpenAI's GPT-4o mini model to generate written content from a simple description.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-writer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
