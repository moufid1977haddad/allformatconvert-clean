import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Markdown to HTML — Convert a Small Subset of Markdown Online" },
  description: "Markdown to HTML converts a small subset of Markdown into a complete HTML document, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/markdown-to-html" },
  openGraph: {
    title: "Markdown to HTML — Convert a Small Subset of Markdown Online",
    description: "Markdown to HTML converts a small subset of Markdown into a complete HTML document, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/markdown-to-html",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
