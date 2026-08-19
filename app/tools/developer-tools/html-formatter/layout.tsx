import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "HTML Formatter — Add Line Breaks Online Free" },
  description: "HTML Formatter adds line breaks and indentation to HTML entirely in your browser using simple pattern-based rules, not a full parser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/html-formatter" },
  openGraph: {
    title: "HTML Formatter — Add Line Breaks Online Free",
    description: "HTML Formatter adds line breaks and indentation to HTML entirely in your browser using simple pattern-based rules, not a full parser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/html-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
