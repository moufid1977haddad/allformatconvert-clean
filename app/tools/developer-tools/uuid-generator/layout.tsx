import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "UUID Generator — v4 Random or v7 Time-Ordered, in Bulk" },
  description: "Generate 1 to 1000 version 4 or version 7 UUIDs, or the nil UUID, in upper or lower case, with or without hyphens or braces, and save them as uuids.txt.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/uuid-generator" },
  openGraph: {
    title: "UUID Generator — v4 Random or v7 Time-Ordered, in Bulk",
    description: "Generate 1 to 1000 version 4 or version 7 UUIDs, or the nil UUID, in upper or lower case, with or without hyphens or braces, and save them as uuids.txt.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/uuid-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/uuid-generator">{children}</ToolSeo>;
}
