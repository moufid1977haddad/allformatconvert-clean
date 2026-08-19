import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JSON Minifier — Parse Your JSON Online Free" },
  description: "JSON Minifier strips whitespace from your JSON using the browser's built-in parser, entirely in your browser — nothing is uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-minifier" },
  openGraph: {
    title: "JSON Minifier — Parse Your JSON Online Free",
    description: "JSON Minifier strips whitespace from your JSON using the browser's built-in parser, entirely in your browser — nothing is uploaded.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-minifier",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
