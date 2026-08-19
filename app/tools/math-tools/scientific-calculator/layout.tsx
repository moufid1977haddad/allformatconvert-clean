import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Scientific Calculator — Evaluate Expressions With" },
  description: "Scientific Calculator evaluates expressions with trigonometric functions, logarithms, square roots, exponents, and parentheses, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/scientific-calculator" },
  openGraph: {
    title: "Scientific Calculator — Evaluate Expressions With",
    description: "Scientific Calculator evaluates expressions with trigonometric functions, logarithms, square roots, exponents, and parentheses, in your browser.",
    url: "https://www.onlineconvertools.com/tools/math-tools/scientific-calculator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
