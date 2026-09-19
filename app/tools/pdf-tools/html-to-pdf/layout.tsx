import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "HTML to PDF — Convert Your HTML Code or File to PDF Online Free" },
  description: "HTML to PDF converts your HTML code or file to PDF with a real browser engine (Chromium). In our tests CSS grid, flexbox, gradients and tables matched Chrome.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/html-to-pdf" },
  openGraph: {
    title: "HTML to PDF — Convert Your HTML Code or File to PDF Online Free",
    description: "HTML to PDF converts your HTML code or file to PDF with a real browser engine (Chromium). In our tests CSS grid, flexbox, gradients and tables matched Chrome.",
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
