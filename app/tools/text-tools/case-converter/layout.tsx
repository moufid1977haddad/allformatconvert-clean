import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Case Converter — Convert Cases Online Free" },
  description: "Case Converter transforms text between UPPERCASE, lowercase, Title Case, Sentence case, and aLtErNaTe (toggle) case, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/case-converter" },
  openGraph: {
    title: "Case Converter — Convert Cases Online Free",
    description: "Case Converter transforms text between UPPERCASE, lowercase, Title Case, Sentence case, and aLtErNaTe (toggle) case, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/text-tools/case-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
