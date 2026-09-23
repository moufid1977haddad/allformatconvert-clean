import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Image Generator — Free Text to Image, No Signup" },
  description: "Turn a text description into an image with OpenAI's gpt-image-2. Square, portrait or landscape, WebP or PNG. 5 free images a day, no signup, no watermark.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/image-generator" },
  openGraph: {
    title: "AI Image Generator — Free Text to Image, No Signup",
    description: "Turn a text description into an image with OpenAI's gpt-image-2. Square, portrait or landscape, WebP or PNG. 5 free images a day, no signup, no watermark.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/image-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
