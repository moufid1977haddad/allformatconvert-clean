import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JSON to C# Class — Generate a Single 'root' Class Online" },
  description: "JSON to C# Class generates a single 'Root' class with one property per top-level JSON key, entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-csharp" },
  openGraph: {
    title: "JSON to C# Class — Generate a Single 'root' Class Online",
    description: "JSON to C# Class generates a single 'Root' class with one property per top-level JSON key, entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-csharp",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
