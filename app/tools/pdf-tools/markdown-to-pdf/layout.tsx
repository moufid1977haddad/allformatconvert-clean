import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Markdown to PDF — Render Your Markdown Online Free" },
  description: "Markdown to PDF renders your Markdown as styled HTML in a new browser tab, entirely on your device — your content is never uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/markdown-to-pdf" },
  openGraph: {
    title: "Markdown to PDF — Render Your Markdown Online Free",
    description: "Markdown to PDF renders your Markdown as styled HTML in a new browser tab, entirely on your device — your content is never uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/markdown-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
