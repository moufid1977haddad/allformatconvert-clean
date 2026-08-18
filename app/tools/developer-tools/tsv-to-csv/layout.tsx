import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "TSV to CSV — Convert Tab-separated Values Online Free" },
  description: "TSV to CSV converts tab-separated values to comma-separated values entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/tsv-to-csv" },
  openGraph: {
    title: "TSV to CSV — Convert Tab-separated Values Online Free",
    description: "TSV to CSV converts tab-separated values to comma-separated values entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/tsv-to-csv",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
