import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Captioner — Use Openai's Gpt-4o Mini Vision Model" },
  description: "Image Captioner is a free online tool that uses OpenAI's GPT-4o mini vision model to generate a descriptive caption for any image you upload.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/image-captioner" },
  openGraph: {
    title: "Image Captioner — Use Openai's Gpt-4o Mini Vision Model",
    description: "Image Captioner is a free online tool that uses OpenAI's GPT-4o mini vision model to generate a descriptive caption for any image you upload.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/image-captioner",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
