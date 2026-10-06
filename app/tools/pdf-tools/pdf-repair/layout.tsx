import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Repair PDF — Fix Broken Structure, Text Checked" },
  description: "Fix a damaged PDF with a broken cross-reference table or a cut-off end on our server, and get it back only if its text still reads the same.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-repair" },
  openGraph: {
    title: "Repair PDF — Fix Broken Structure, Text Checked",
    description: "Fix a damaged PDF with a broken cross-reference table or a cut-off end on our server, and get it back only if its text still reads the same.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-repair",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-repair">{children}</ToolSeo>;
}
