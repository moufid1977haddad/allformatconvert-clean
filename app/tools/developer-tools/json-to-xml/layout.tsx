import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JSON to XML — Recursively Converts JSON Into Nested XML Tags" },
  description: "JSON to XML recursively converts JSON into nested XML tags — each key becomes a tag name, with objects nesting naturally — entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-xml" },
  openGraph: {
    title: "JSON to XML — Recursively Converts JSON Into Nested XML Tags",
    description: "JSON to XML recursively converts JSON into nested XML tags — each key becomes a tag name, with objects nesting naturally — entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-xml",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
