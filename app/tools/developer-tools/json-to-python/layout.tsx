import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JSON to Python Dataclass Generator — Typed, snake_case" },
  description: "Turn JSON into Python @dataclass definitions with int, float, str, List, Optional and Union types and snake_case names, made by quicktype on your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-python" },
  openGraph: {
    title: "JSON to Python Dataclass Generator — Typed, snake_case",
    description: "Turn JSON into Python @dataclass definitions with int, float, str, List, Optional and Union types and snake_case names, made by quicktype on your device.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-python",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/json-to-python">{children}</ToolSeo>;
}
