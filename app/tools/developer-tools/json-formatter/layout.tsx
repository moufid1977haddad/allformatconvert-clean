import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JSON Formatter — Parse Your JSON Online Free" },
  description: "JSON Formatter parses your JSON with the browser's built-in JSON.parse and re-serializes it with JSON.stringify, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-formatter" },
  openGraph: {
    title: "JSON Formatter — Parse Your JSON Online Free",
    description: "JSON Formatter parses your JSON with the browser's built-in JSON.parse and re-serializes it with JSON.stringify, in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
