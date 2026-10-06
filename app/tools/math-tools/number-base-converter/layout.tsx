import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Number Base Converter — Bases 2 to 36 With Exact Fractions" },
  description: "Convert a number between any bases from 2 to 36, fractions included: 0.1 in decimal shows its repeating binary digits instead of a rounded value.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/number-base-converter" },
  openGraph: {
    title: "Number Base Converter — Bases 2 to 36 With Exact Fractions",
    description: "Convert a number between any bases from 2 to 36, fractions included: 0.1 in decimal shows its repeating binary digits instead of a rounded value.",
    url: "https://www.onlineconvertools.com/tools/math-tools/number-base-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/math-tools/number-base-converter">{children}</ToolSeo>;
}
