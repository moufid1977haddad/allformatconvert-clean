import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JS Minifier — Terser in Your Browser, Locals Renamed" },
  description: "Minify JavaScript with Terser: shorter local names, dead code and comments removed, modern syntax and modules accepted. Shows the characters saved.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/js-minifier" },
  openGraph: {
    title: "JS Minifier — Terser in Your Browser, Locals Renamed",
    description: "Minify JavaScript with Terser: shorter local names, dead code and comments removed, modern syntax and modules accepted. Shows the characters saved.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/js-minifier",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/js-minifier">{children}</ToolSeo>;
}
