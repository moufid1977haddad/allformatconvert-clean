import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

const TITLE = "Code Formatter — JavaScript, TypeScript, JSON, HTML, CSS, SQL, YAML Online";
const DESCRIPTION = "Code Formatter formats JavaScript, TypeScript, JSX, JSON, HTML, XML, CSS, SCSS, LESS, SQL (20 dialects), YAML, Markdown and GraphQL entirely in your browser, with automatic language detection and errors shown by line and column.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/code-formatter" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
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
