import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI PDF Summary — Send Your File Online Free" },
  description: "AI PDF Summary sends your file to our server, which passes it to OpenAI's gpt-4o-mini model for a text summary.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-ai-summary" },
  openGraph: {
    title: "AI PDF Summary — Send Your File Online Free",
    description: "AI PDF Summary sends your file to our server, which passes it to OpenAI's gpt-4o-mini model for a text summary.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-ai-summary",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
