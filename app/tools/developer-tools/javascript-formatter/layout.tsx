import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JavaScript Formatter — Add Line Breaks Online Free" },
  description: "JavaScript Formatter adds line breaks and indentation around braces, brackets, semicolons, and commas entirely in your browser, and its Minify button does…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/javascript-formatter" },
  openGraph: {
    title: "JavaScript Formatter — Add Line Breaks Online Free",
    description: "JavaScript Formatter adds line breaks and indentation around braces, brackets, semicolons, and commas entirely in your browser, and its Minify button does…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/javascript-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
