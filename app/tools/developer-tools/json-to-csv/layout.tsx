import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JSON to CSV Converter — Nested Objects to Dotted Columns" },
  description: "Paste a JSON array or object and get CSV: nested objects become columns like address.city, arrays like tags.0. Large numbers keep every digit.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-csv" },
  openGraph: {
    title: "JSON to CSV Converter — Nested Objects to Dotted Columns",
    description: "Paste a JSON array or object and get CSV: nested objects become columns like address.city, arrays like tags.0. Large numbers keep every digit.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-csv",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/json-to-csv">{children}</ToolSeo>;
}
