import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Roman Numeral Converter — 1 to 3999, Standard Form Only" },
  description: "Turn a number from 1 to 3999 into a Roman numeral, or read a numeral back as a number. Non-standard forms such as IIII or IM are flagged, not guessed.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/roman-numeral-converter" },
  openGraph: {
    title: "Roman Numeral Converter — 1 to 3999, Standard Form Only",
    description: "Turn a number from 1 to 3999 into a Roman numeral, or read a numeral back as a number. Non-standard forms such as IIII or IM are flagged, not guessed.",
    url: "https://www.onlineconvertools.com/tools/math-tools/roman-numeral-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/math-tools/roman-numeral-converter">{children}</ToolSeo>;
}
