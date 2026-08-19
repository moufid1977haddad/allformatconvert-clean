import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to HTML — Extract Each Page's Plain Text Online Free" },
  description: "PDF to HTML extracts each page's plain text and wraps it in a simple generic HTML page, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-html" },
  openGraph: {
    title: "PDF to HTML — Extract Each Page's Plain Text Online Free",
    description: "PDF to HTML extracts each page's plain text and wraps it in a simple generic HTML page, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-html",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
