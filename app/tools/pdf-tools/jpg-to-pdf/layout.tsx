import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JPG to PDF — Be a One-shot Batch Converter: Select Your" },
  description: "JPG to PDF is a one-shot batch converter: select your JPG or PNG photos, and pdf-lib stitches them into a single PDF in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/jpg-to-pdf" },
  openGraph: {
    title: "JPG to PDF — Be a One-shot Batch Converter: Select Your",
    description: "JPG to PDF is a one-shot batch converter: select your JPG or PNG photos, and pdf-lib stitches them into a single PDF in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/jpg-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
