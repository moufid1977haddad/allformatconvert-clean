import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Scientific Calculator — Degrees or Radians, log, ln, n!, Ans" },
  description: "Evaluate expressions with sin, cos, tan and their inverses in degrees or radians, log, ln, roots, powers and factorials, to 12 significant digits.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/scientific-calculator" },
  openGraph: {
    title: "Scientific Calculator — Degrees or Radians, log, ln, n!, Ans",
    description: "Evaluate expressions with sin, cos, tan and their inverses in degrees or radians, log, ln, roots, powers and factorials, to 12 significant digits.",
    url: "https://www.onlineconvertools.com/tools/math-tools/scientific-calculator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/math-tools/scientific-calculator">{children}</ToolSeo>;
}
