import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Word to PDF — Convert Your .docx or .doc File Online Free" },
  description: "Word to PDF converts your .docx or .doc file to PDF. In our tests .docx output matched two other online converters; a table of contents is not recalculated.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/word-to-pdf" },
  openGraph: {
    title: "Word to PDF — Convert Your .docx or .doc File Online Free",
    description: "Word to PDF converts your .docx or .doc file to PDF. In our tests .docx output matched two other online converters; a table of contents is not recalculated.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/word-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
