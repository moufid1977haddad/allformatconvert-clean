import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Redact — Search Your Pdf's Text for a Keyword Online" },
  description: "PDF Redact searches your PDF's text for a keyword, then permanently destroys the matched text rather than just covering it up.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-redact" },
  openGraph: {
    title: "PDF Redact — Search Your Pdf's Text for a Keyword Online",
    description: "PDF Redact searches your PDF's text for a keyword, then permanently destroys the matched text rather than just covering it up.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-redact",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
