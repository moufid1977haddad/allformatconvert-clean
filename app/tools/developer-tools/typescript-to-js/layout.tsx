import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "TypeScript to JavaScript Converter — Types Removed" },
  description: "Remove TypeScript types, interfaces, generics and casts with Sucrase and keep the JavaScript as written. No type checking; Sucrase runs on your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/typescript-to-js" },
  openGraph: {
    title: "TypeScript to JavaScript Converter — Types Removed",
    description: "Remove TypeScript types, interfaces, generics and casts with Sucrase and keep the JavaScript as written. No type checking; Sucrase runs on your device.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/typescript-to-js",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/typescript-to-js">{children}</ToolSeo>;
}
