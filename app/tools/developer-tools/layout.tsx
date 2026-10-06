import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Developer Tools: JSON, CSV, Formatters, Encoders, Generators" },
  description: "Convert JSON, XML, YAML, TOML, CSV and Excel, format and minify code, encode Base64 and URLs, generate UUIDs, hashes and types from JSON.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools" },
  openGraph: {
    title: "Developer Tools: JSON, CSV, Formatters, Encoders, Generators",
    description: "Convert JSON, XML, YAML, TOML, CSV and Excel, format and minify code, encode Base64 and URLs, generate UUIDs, hashes and types from JSON.",
    url: "https://www.onlineconvertools.com/tools/developer-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
