import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JSON to XML Converter — Attributes, Arrays, Escaped Text" },
  description: "Paste JSON and get indented XML under a root element. Arrays become repeated tags, @_ keys become attributes, and & or < are escaped. In your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-xml" },
  openGraph: {
    title: "JSON to XML Converter — Attributes, Arrays, Escaped Text",
    description: "Paste JSON and get indented XML under a root element. Arrays become repeated tags, @_ keys become attributes, and & or < are escaped. In your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-xml",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/json-to-xml">{children}</ToolSeo>;
}
