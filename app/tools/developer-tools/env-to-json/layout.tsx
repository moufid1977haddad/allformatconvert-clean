import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: ".env to JSON Converter — dotenv Rules, Both Directions" },
  description: "Paste a .env file to get a JSON object, or a JSON object to get .env lines. Parsed like dotenv, with optional types and variable expansion.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/env-to-json" },
  openGraph: {
    title: ".env to JSON Converter — dotenv Rules, Both Directions",
    description: "Paste a .env file to get a JSON object, or a JSON object to get .env lines. Parsed like dotenv, with optional types and variable expansion.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/env-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/env-to-json">{children}</ToolSeo>;
}
