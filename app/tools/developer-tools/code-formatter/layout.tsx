import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Code Formatter — 13 Languages, Auto-Detected, Prettier" },
  description: "Format JavaScript, TypeScript, JSON, HTML, XML, CSS, SQL, YAML, Markdown or GraphQL in your browser, with the language detected from the code itself.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/code-formatter" },
  openGraph: {
    title: "Code Formatter — 13 Languages, Auto-Detected, Prettier",
    description: "Format JavaScript, TypeScript, JSON, HTML, XML, CSS, SQL, YAML, Markdown or GraphQL in your browser, with the language detected from the code itself.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/code-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/code-formatter">{children}</ToolSeo>;
}
