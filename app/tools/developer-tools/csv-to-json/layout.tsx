import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "CSV to JSON — Parse Pasted CSV Text Online Free" },
  description: "CSV to JSON parses pasted CSV text and converts it to an array of JSON objects entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/csv-to-json" },
  openGraph: {
    title: "CSV to JSON — Parse Pasted CSV Text Online Free",
    description: "CSV to JSON parses pasted CSV text and converts it to an array of JSON objects entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/csv-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
