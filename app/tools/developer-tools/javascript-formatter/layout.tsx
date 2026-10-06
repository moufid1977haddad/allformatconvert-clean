import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JavaScript Formatter & Minifier — Beautify or Shrink JS" },
  description: "Beautify JavaScript with js-beautify and a 2-space indent, or minify it with Terser, which renames locals and drops dead code, on your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/javascript-formatter" },
  openGraph: {
    title: "JavaScript Formatter & Minifier — Beautify or Shrink JS",
    description: "Beautify JavaScript with js-beautify and a 2-space indent, or minify it with Terser, which renames locals and drops dead code, on your device.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/javascript-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/javascript-formatter">{children}</ToolSeo>;
}
