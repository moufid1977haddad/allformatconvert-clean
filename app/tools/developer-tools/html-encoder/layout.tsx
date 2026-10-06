import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "HTML Encoder — Escape & < > and Quotes as Entities" },
  description: "Escape &, <, >, quotes and apostrophes before you put text into HTML, or decode entities back in one pass. Runs in your browser, nothing saved.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/html-encoder" },
  openGraph: {
    title: "HTML Encoder — Escape & < > and Quotes as Entities",
    description: "Escape &, <, >, quotes and apostrophes before you put text into HTML, or decode entities back in one pass. Runs in your browser, nothing saved.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/html-encoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/html-encoder">{children}</ToolSeo>;
}
