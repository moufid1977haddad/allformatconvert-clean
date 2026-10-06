import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "File Comparator — Check Two Files Match, Byte by Byte" },
  description: "Compare two files of any type byte by byte in your browser, and see the position of the first difference or confirm that both match exactly.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-comparator" },
  openGraph: {
    title: "File Comparator — Check Two Files Match, Byte by Byte",
    description: "Compare two files of any type byte by byte in your browser, and see the position of the first difference or confirm that both match exactly.",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-comparator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/file-comparator">{children}</ToolSeo>;
}
