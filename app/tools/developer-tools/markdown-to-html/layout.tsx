import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Markdown to HTML Converter — Full HTML5 Page, GFM Rules" },
  description: "Convert Markdown to a complete HTML5 document that declares UTF-8 encoding, using CommonMark and GitHub Flavored Markdown; copy it or save document.html.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/markdown-to-html" },
  openGraph: {
    title: "Markdown to HTML Converter — Full HTML5 Page, GFM Rules",
    description: "Convert Markdown to a complete HTML5 document that declares UTF-8 encoding, using CommonMark and GitHub Flavored Markdown; copy it or save document.html.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/markdown-to-html",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/markdown-to-html">{children}</ToolSeo>;
}
