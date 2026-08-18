import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to PowerPoint — A Tool to Convert a PDF Online Free" },
  description: "A tool to convert a PDF into an editable PowerPoint presentation is not yet available — this feature is under development.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-ppt" },
  openGraph: {
    title: "PDF to PowerPoint — A Tool to Convert a PDF Online Free",
    description: "A tool to convert a PDF into an editable PowerPoint presentation is not yet available — this feature is under development.",
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
