import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "HTML Entity Decoder — Decode HTML Entities Online Free" },
  description: "HTML Entity Decoder decodes HTML entities — named and numeric — back into plain text using the browser's own DOMParser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/html-entity-decoder" },
  openGraph: {
    title: "HTML Entity Decoder — Decode HTML Entities Online Free",
    description: "HTML Entity Decoder decodes HTML entities — named and numeric — back into plain text using the browser's own DOMParser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/html-entity-decoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
