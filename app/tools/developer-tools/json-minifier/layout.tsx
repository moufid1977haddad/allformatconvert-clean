import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JSON Minifier — One Line, Numbers and Escapes Unchanged" },
  description: "Compress JSON to one line by removing whitespace outside strings. Checked with JSON.parse; 20-digit ids and 1e21 stay as typed, on your own device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-minifier" },
  openGraph: {
    title: "JSON Minifier — One Line, Numbers and Escapes Unchanged",
    description: "Compress JSON to one line by removing whitespace outside strings. Checked with JSON.parse; 20-digit ids and 1e21 stay as typed, on your own device.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-minifier",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/json-minifier">{children}</ToolSeo>;
}
