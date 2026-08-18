import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "HTML to PDF — Open Your HTML Code or File Online Free" },
  description: "HTML to PDF opens your HTML code or file — including its CSS — in a new browser tab, entirely on your device, and never uploads it to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/html-to-pdf" },
  openGraph: {
    title: "HTML to PDF — Open Your HTML Code or File Online Free",
    description: "HTML to PDF opens your HTML code or file — including its CSS — in a new browser tab, entirely on your device, and never uploads it to a server.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/html-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
