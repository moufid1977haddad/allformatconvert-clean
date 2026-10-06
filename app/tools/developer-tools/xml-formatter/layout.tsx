import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "XML Formatter — Well-Formedness Check, 2-Space Indent" },
  description: "Check that XML is well-formed and re-indent it by 2 spaces per level, in your browser. Errors give line and column; CDATA is never split.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/xml-formatter" },
  openGraph: {
    title: "XML Formatter — Well-Formedness Check, 2-Space Indent",
    description: "Check that XML is well-formed and re-indent it by 2 spaces per level, in your browser. Errors give line and column; CDATA is never split.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/xml-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/xml-formatter">{children}</ToolSeo>;
}
