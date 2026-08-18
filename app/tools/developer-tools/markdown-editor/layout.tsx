import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Markdown Editor — Edit Markdowns Online Free" },
  description: "Markdown Editor gives you a split-screen view that renders a small subset of Markdown live as you type — headings (#, ##, ###), bold (**text**), italic…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/markdown-editor" },
  openGraph: {
    title: "Markdown Editor — Edit Markdowns Online Free",
    description: "Markdown Editor gives you a split-screen view that renders a small subset of Markdown live as you type — headings (#, ##, ###), bold (**text**), italic…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/markdown-editor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
