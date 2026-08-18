import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "TypeScript to JavaScript — Strip Type Annotations Online" },
  description: "TypeScript to JavaScript strips type annotations using regex pattern matching, not the real TypeScript compiler, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/typescript-to-js" },
  openGraph: {
    title: "TypeScript to JavaScript — Strip Type Annotations Online",
    description: "TypeScript to JavaScript strips type annotations using regex pattern matching, not the real TypeScript compiler, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/typescript-to-js",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
