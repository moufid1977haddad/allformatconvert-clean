import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Word to PDF — Convert Your .docx File Online Free" },
  description: "Word to PDF converts your .docx file into a real PDF using LibreOffice — accurate for standard fonts, with Wingdings/Webdings as the one disclosed exception.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/word-to-pdf" },
  openGraph: {
    title: "Word to PDF — Convert Your .docx File Online Free",
    description: "Word to PDF converts your .docx file into a real PDF using LibreOffice — accurate for standard fonts, with Wingdings/Webdings as the one disclosed exception.",
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
