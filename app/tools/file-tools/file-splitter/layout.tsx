import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "File Splitter — Split Any File by Size or Into Equal Parts" },
  description: "Cut a file into numbered parts by size or into equal parts, then join the .part files back into the original, in your browser. Files up to 5 GB.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-splitter" },
  openGraph: {
    title: "File Splitter — Split Any File by Size or Into Equal Parts",
    description: "Cut a file into numbered parts by size or into equal parts, then join the .part files back into the original, in your browser. Files up to 5 GB.",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-splitter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/file-splitter">{children}</ToolSeo>;
}
