import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Aspect Ratio Calculator — Compute the Simplified Ratio" },
  description: "Aspect Ratio Calculator computes the simplified ratio and decimal value for any width and height you enter, live in your browser as you type.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/aspect-ratio" },
  openGraph: {
    title: "Aspect Ratio Calculator — Compute the Simplified Ratio",
    description: "Aspect Ratio Calculator computes the simplified ratio and decimal value for any width and height you enter, live in your browser as you type.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/aspect-ratio",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
