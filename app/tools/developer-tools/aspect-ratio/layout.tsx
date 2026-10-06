import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Aspect Ratio Calculator — Simplify W:H, Find a Missing Side" },
  description: "Enter a width and a height to get the simplified ratio and its decimal, or type a new width to get the height that keeps the same proportions.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/aspect-ratio" },
  openGraph: {
    title: "Aspect Ratio Calculator — Simplify W:H, Find a Missing Side",
    description: "Enter a width and a height to get the simplified ratio and its decimal, or type a new width to get the height that keeps the same proportions.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/aspect-ratio",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/aspect-ratio">{children}</ToolSeo>;
}
