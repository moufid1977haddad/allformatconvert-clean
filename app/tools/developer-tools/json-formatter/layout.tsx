import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JSON Formatter & Validator — Exact Numbers, Sort Keys" },
  description: "Validate and beautify JSON with 2 spaces, 4 spaces or tabs, sort keys A-Z, or minify. Errors show line and column; numbers stay exactly as typed.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-formatter" },
  openGraph: {
    title: "JSON Formatter & Validator — Exact Numbers, Sort Keys",
    description: "Validate and beautify JSON with 2 spaces, 4 spaces or tabs, sort keys A-Z, or minify. Errors show line and column; numbers stay exactly as typed.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/json-formatter">{children}</ToolSeo>;
}
