import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Math Tools: Fractions, Percentages, Statistics, Calculator" },
  description: "Exact fraction arithmetic with steps, six percentage calculations, 23 statistics, a scientific calculator, Roman numerals and bases 2 to 36.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools" },
  openGraph: {
    title: "Math Tools: Fractions, Percentages, Statistics, Calculator",
    description: "Exact fraction arithmetic with steps, six percentage calculations, 23 statistics, a scientific calculator, Roman numerals and bases 2 to 36.",
    url: "https://www.onlineconvertools.com/tools/math-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
