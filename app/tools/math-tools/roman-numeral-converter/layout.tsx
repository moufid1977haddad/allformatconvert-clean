import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Roman Numeral Converter — Convert Between Arabic Numbers" },
  description: "Roman Numeral Converter converts between Arabic numbers (1–3999) and Roman numerals instantly and bidirectionally as you type, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/roman-numeral-converter" },
  openGraph: {
    title: "Roman Numeral Converter — Convert Between Arabic Numbers",
    description: "Roman Numeral Converter converts between Arabic numbers (1–3999) and Roman numerals instantly and bidirectionally as you type, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/math-tools/roman-numeral-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
