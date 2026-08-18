import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Fraction Calculator — Adds, Subtracts, Multiplies Online" },
  description: "Fraction Calculator adds, subtracts, multiplies, and divides two fractions entirely in your browser, automatically reducing every result to its simplest form…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/fraction-calculator" },
  openGraph: {
    title: "Fraction Calculator — Adds, Subtracts, Multiplies Online",
    description: "Fraction Calculator adds, subtracts, multiplies, and divides two fractions entirely in your browser, automatically reducing every result to its simplest form…",
    url: "https://www.onlineconvertools.com/tools/math-tools/fraction-calculator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
