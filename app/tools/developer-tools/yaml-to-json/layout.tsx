import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "YAML to JSON — Convert Full YAML (Nested, Lists) Online Free" },
  description: "YAML to JSON parses YAML using the js-yaml library and converts it to JSON, entirely in your browser — nested structures, lists, and comments all parse correctly.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/yaml-to-json" },
  openGraph: {
    title: "YAML to JSON — Convert Full YAML (Nested, Lists) Online Free",
    description: "YAML to JSON parses YAML using the js-yaml library and converts it to JSON, entirely in your browser — nested structures, lists, and comments all parse correctly.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/yaml-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
