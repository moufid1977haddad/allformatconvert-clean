import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JSON to Go Struct Generator — json Tags and Pointers" },
  description: "Turn a JSON sample into Go structs with json tags, int64 or float64 fields and pointers for optional keys. Built in your browser with quicktype.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-go" },
  openGraph: {
    title: "JSON to Go Struct Generator — json Tags and Pointers",
    description: "Turn a JSON sample into Go structs with json tags, int64 or float64 fields and pointers for optional keys. Built in your browser with quicktype.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-go",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/json-to-go">{children}</ToolSeo>;
}
