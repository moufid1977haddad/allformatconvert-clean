import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Whitespace Remover — Remove Extra Spaces & Blank Lines Online Free" },
  description: "Remove extra spaces, tabs and blank lines from text without merging your lines, or join it into one line — entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/whitespace-remover" },
  openGraph: {
    title: "Whitespace Remover — Remove Extra Spaces & Blank Lines Online Free",
    description: "Remove extra spaces, tabs and blank lines from text without merging your lines, or join it into one line — entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/text-tools/whitespace-remover",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
