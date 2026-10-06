import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "URL Encoder — encodeURIComponent, encodeURI or RFC 3986" },
  description: "Percent-encode a query value, a whole URL or strict RFC 3986 output, and decode %XX with + read as a space. Same calls as JavaScript, run locally.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/url-encoder" },
  openGraph: {
    title: "URL Encoder — encodeURIComponent, encodeURI or RFC 3986",
    description: "Percent-encode a query value, a whole URL or strict RFC 3986 output, and decode %XX with + read as a space. Same calls as JavaScript, run locally.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/url-encoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/url-encoder">{children}</ToolSeo>;
}
