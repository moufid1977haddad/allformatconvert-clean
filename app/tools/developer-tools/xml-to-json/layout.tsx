import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "XML to JSON Converter — Attributes Kept, Leading Zeros Too" },
  description: "Paste XML and get JSON with attributes as @_ keys, repeated tags as arrays and every value kept as text, so 0612 and 1.10 stay intact. In your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/xml-to-json" },
  openGraph: {
    title: "XML to JSON Converter — Attributes Kept, Leading Zeros Too",
    description: "Paste XML and get JSON with attributes as @_ keys, repeated tags as arrays and every value kept as text, so 0612 and 1.10 stay intact. In your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/xml-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/xml-to-json">{children}</ToolSeo>;
}
