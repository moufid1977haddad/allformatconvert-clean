import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Split — Create a Separate PDF File Online Free" },
  description: "PDF Split creates a separate PDF file for each comma-separated range or page number you type (e.g.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-split" },
  openGraph: {
    title: "PDF Split — Create a Separate PDF File Online Free",
    description: "PDF Split creates a separate PDF file for each comma-separated range or page number you type (e.g.",
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
