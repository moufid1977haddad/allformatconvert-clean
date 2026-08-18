import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Text to List — Turn Lines of Pasted Text Online Free" },
  description: "Text to List turns lines of pasted text into a bullet list, numbered list, or comma-separated list, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-to-list" },
  openGraph: {
    title: "Text to List — Turn Lines of Pasted Text Online Free",
    description: "Text to List turns lines of pasted text into a bullet list, numbered list, or comma-separated list, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-to-list",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
