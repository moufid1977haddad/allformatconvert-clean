import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JSON to TypeScript Interface Generator — Optional Fields" },
  description: "Paste JSON and get TypeScript interfaces: one per nested object, ? for keys some items lack, | null for null values, written by quicktype on your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-typescript" },
  openGraph: {
    title: "JSON to TypeScript Interface Generator — Optional Fields",
    description: "Paste JSON and get TypeScript interfaces: one per nested object, ? for keys some items lack, | null for null values, written by quicktype on your device.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-typescript",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/json-to-typescript">{children}</ToolSeo>;
}
