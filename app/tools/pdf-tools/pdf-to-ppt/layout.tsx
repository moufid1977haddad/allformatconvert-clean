import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to PowerPoint — Convert PDF to Editable Slides" },
  description: "Convert each page of a PDF into an editable PowerPoint slide (.pptx). Free, no signup, files up to 99 MB.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-ppt" },
  openGraph: {
    title: "PDF to PowerPoint — Convert PDF to Editable Slides",
    description: "Convert each page of a PDF into an editable PowerPoint slide (.pptx). Free, no signup, files up to 99 MB.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-ppt",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
