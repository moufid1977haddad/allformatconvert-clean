import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to Word — Extract Each Page's Plain Text Online Free" },
  description: "PDF to Word extracts each page's plain text using the PDF.js library and writes it into a new .docx file as plain paragraphs, using the docx library entirely…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-word" },
  openGraph: {
    title: "PDF to Word — Extract Each Page's Plain Text Online Free",
    description: "PDF to Word extracts each page's plain text using the PDF.js library and writes it into a new .docx file as plain paragraphs, using the docx library entirely…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-word",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
