import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "URL Parser — Split a URL into Host, Path and Query Params" },
  description: "Break a URL into protocol, hostname, port, pathname, search and hash, with each query parameter decoded and repeated keys kept together.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/url-parser" },
  openGraph: {
    title: "URL Parser — Split a URL into Host, Path and Query Params",
    description: "Break a URL into protocol, hostname, port, pathname, search and hash, with each query parameter decoded and repeated keys kept together.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/url-parser",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/url-parser">{children}</ToolSeo>;
}
