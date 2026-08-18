import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to PDF/A — A Tool to Convert a Standard PDF Online Free" },
  description: "A tool to convert a standard PDF into the archival PDF/A format is not yet available — this feature is under development.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-pdfa" },
  openGraph: {
    title: "PDF to PDF/A — A Tool to Convert a Standard PDF Online Free",
    description: "A tool to convert a standard PDF into the archival PDF/A format is not yet available — this feature is under development.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-pdfa",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
