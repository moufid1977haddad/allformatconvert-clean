import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PowerPoint to PDF — Convert Your .pptx or .ppt File Online Free" },
  description: "PowerPoint to PDF converts your .pptx or .ppt file to PDF using LibreOffice. In our tests layout, images, gradients and tables carried over; a substituted font can shift text.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/ppt-to-pdf" },
  openGraph: {
    title: "PowerPoint to PDF — Convert Your .pptx or .ppt File Online Free",
    description: "PowerPoint to PDF converts your .pptx or .ppt file to PDF using LibreOffice. In our tests layout, images, gradients and tables carried over; a substituted font can shift text.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/ppt-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
