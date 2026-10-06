import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "YAML to JSON Converter — Anchors, Merge Keys, Many Documents" },
  description: "Paste YAML, such as a Kubernetes or Docker Compose file, and get JSON. Anchors, merge keys and --- documents are handled; yes stays text. In your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/yaml-to-json" },
  openGraph: {
    title: "YAML to JSON Converter — Anchors, Merge Keys, Many Documents",
    description: "Paste YAML, such as a Kubernetes or Docker Compose file, and get JSON. Anchors, merge keys and --- documents are handled; yes stays text. In your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/yaml-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/yaml-to-json">{children}</ToolSeo>;
}
