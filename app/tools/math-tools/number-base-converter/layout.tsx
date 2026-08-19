import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Number Base Converter — Instantly Converts a Number Online" },
  description: "Number Base Converter instantly converts a number between binary, octal, decimal, and hexadecimal, showing all four results as you type.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/number-base-converter" },
  openGraph: {
    title: "Number Base Converter — Instantly Converts a Number Online",
    description: "Number Base Converter instantly converts a number between binary, octal, decimal, and hexadecimal, showing all four results as you type.",
    url: "https://www.onlineconvertools.com/tools/math-tools/number-base-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
