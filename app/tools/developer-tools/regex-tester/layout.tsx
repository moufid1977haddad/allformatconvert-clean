import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Regex Tester — Run Your Pattern Against Javascript's Native" },
  description: "Regex Tester runs your pattern against JavaScript's native RegExp engine, entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/regex-tester" },
  openGraph: {
    title: "Regex Tester — Run Your Pattern Against Javascript's Native",
    description: "Regex Tester runs your pattern against JavaScript's native RegExp engine, entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/regex-tester",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
