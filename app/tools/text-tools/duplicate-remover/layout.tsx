import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Duplicate Remover — Strip Out Repeated Lines Online Free" },
  description: "Duplicate Remover strips out repeated lines from a block of text, keeping only the first occurrence of each line, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/duplicate-remover" },
  openGraph: {
    title: "Duplicate Remover — Strip Out Repeated Lines Online Free",
    description: "Duplicate Remover strips out repeated lines from a block of text, keeping only the first occurrence of each line, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/text-tools/duplicate-remover",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
