import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Split — Create a Separate PDF File Online Free" },
  description: "Split a PDF by custom ranges, every N pages, every page or chosen pages, and download the parts one by one or as a ZIP — in your browser, nothing uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-split" },
  openGraph: {
    title: "PDF Split — Create a Separate PDF File Online Free",
    description: "Split a PDF by custom ranges, every N pages, every page or chosen pages, and download the parts one by one or as a ZIP — in your browser, nothing uploaded.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-split",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
