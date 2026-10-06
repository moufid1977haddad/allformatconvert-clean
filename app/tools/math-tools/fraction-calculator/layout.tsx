import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Fraction Calculator — Mixed Numbers, Steps, Exact Decimals" },
  description: "Add, subtract, multiply or divide two fractions or mixed numbers, and get the reduced fraction, the mixed number, an exact decimal and every step.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/fraction-calculator" },
  openGraph: {
    title: "Fraction Calculator — Mixed Numbers, Steps, Exact Decimals",
    description: "Add, subtract, multiply or divide two fractions or mixed numbers, and get the reduced fraction, the mixed number, an exact decimal and every step.",
    url: "https://www.onlineconvertools.com/tools/math-tools/fraction-calculator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/math-tools/fraction-calculator">{children}</ToolSeo>;
}
