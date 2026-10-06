import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Text Tools: Word Counter, Case Converter, Sort, Clean Text" },
  description: "Count words and characters, change case, sort, de-duplicate and clean lines, compare two texts and encrypt text with a password, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools" },
  openGraph: {
    title: "Text Tools: Word Counter, Case Converter, Sort, Clean Text",
    description: "Count words and characters, change case, sort, de-duplicate and clean lines, compare two texts and encrypt text with a password, in your browser.",
    url: "https://www.onlineconvertools.com/tools/text-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
