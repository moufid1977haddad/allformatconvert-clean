import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Number Base Converter — Convert Number Bases Online Free" },
  description: "Number Base Converter shows a number in binary, octal, decimal, and hexadecimal simultaneously, live as you type, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/number-base-converter" },
  openGraph: {
    title: "Number Base Converter — Convert Number Bases Online Free",
    description: "Number Base Converter shows a number in binary, octal, decimal, and hexadecimal simultaneously, live as you type, in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/number-base-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
