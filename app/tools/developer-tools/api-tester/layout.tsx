import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "API Tester — Send GET, POST, PUT, PATCH, DELETE Requests" },
  description: "Send GET, POST, PUT, DELETE or PATCH requests from your browser to the URL you enter, with JSON headers and a body, then read the status and body.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/api-tester" },
  openGraph: {
    title: "API Tester — Send GET, POST, PUT, PATCH, DELETE Requests",
    description: "Send GET, POST, PUT, DELETE or PATCH requests from your browser to the URL you enter, with JSON headers and a body, then read the status and body.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/api-tester",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/api-tester">{children}</ToolSeo>;
}
