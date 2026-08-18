import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Text Tools — Word Count, Case Conversion, Text Formatting" },
  description: "Text Tools is a free online suite of powerful utilities designed to help you manipulate, analyze, and transform text instantly without any downloads…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools" },
  openGraph: {
    title: "Text Tools — Word Count, Case Conversion, Text Formatting",
    description: "Text Tools is a free online suite of powerful utilities designed to help you manipulate, analyze, and transform text instantly without any downloads…",
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
