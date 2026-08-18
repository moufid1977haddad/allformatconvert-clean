import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Data Extractor — Extract Data Online Free" },
  description: "Data Extractor is a free online tool that uses OpenAI's GPT-4o mini model to pull structured information out of pasted text.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/data-extractor" },
  openGraph: {
    title: "Data Extractor — Extract Data Online Free",
    description: "Data Extractor is a free online tool that uses OpenAI's GPT-4o mini model to pull structured information out of pasted text.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/data-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
