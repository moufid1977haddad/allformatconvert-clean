import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "HTML to PDF — Convert Your HTML Code or File to PDF Online Free" },
  description: "HTML to PDF converts your HTML code or file into a real, professional-quality PDF using a real browser rendering engine — accurate CSS, images, and layout.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/html-to-pdf" },
  openGraph: {
    title: "HTML to PDF — Convert Your HTML Code or File to PDF Online Free",
    description: "HTML to PDF converts your HTML code or file into a real, professional-quality PDF using a real browser rendering engine — accurate CSS, images, and layout.",
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
