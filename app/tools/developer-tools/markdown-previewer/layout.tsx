import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Markdown Previewer — Render a Small Subset Online Free" },
  description: "Markdown Previewer renders a small subset of Markdown live as you type — headings, bold, italic, and lists — in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/markdown-previewer" },
  openGraph: {
    title: "Markdown Previewer — Render a Small Subset Online Free",
    description: "Markdown Previewer renders a small subset of Markdown live as you type — headings, bold, italic, and lists — in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/markdown-previewer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
