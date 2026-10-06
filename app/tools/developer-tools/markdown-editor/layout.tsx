import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Markdown Editor — Write, Preview, Save as .md or .html" },
  description: "Write Markdown beside a live preview, then download your text as document.md, the generated HTML as document.html, or both in document.zip.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/markdown-editor" },
  openGraph: {
    title: "Markdown Editor — Write, Preview, Save as .md or .html",
    description: "Write Markdown beside a live preview, then download your text as document.md, the generated HTML as document.html, or both in document.zip.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/markdown-editor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/markdown-editor">{children}</ToolSeo>;
}
