import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JSON to TOML — Convert Full JSON (Nested, Arrays) Online Free" },
  description: "JSON to TOML converts a JSON object into valid TOML using the smol-toml library, entirely in your browser — nested tables and arrays at any depth convert correctly.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-toml" },
  openGraph: {
    title: "JSON to TOML — Convert Full JSON (Nested, Arrays) Online Free",
    description: "JSON to TOML converts a JSON object into valid TOML using the smol-toml library, entirely in your browser — nested tables and arrays at any depth convert correctly.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-toml",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
