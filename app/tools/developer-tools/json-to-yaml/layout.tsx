import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JSON to YAML Converter — Exact Numbers, Safe Quoting" },
  description: "Paste JSON and get block-style YAML. Numbers stay as written, and strings such as yes, no or 1.10 are quoted so they stay text. In your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-yaml" },
  openGraph: {
    title: "JSON to YAML Converter — Exact Numbers, Safe Quoting",
    description: "Paste JSON and get block-style YAML. Numbers stay as written, and strings such as yes, no or 1.10 are quoted so they stay text. In your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-yaml",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/json-to-yaml">{children}</ToolSeo>;
}
