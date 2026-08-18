import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JSON to TOML — Convert a Flat or One-level-nested JSON" },
  description: "JSON to TOML converts a flat or one-level-nested JSON object into TOML text, entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-toml" },
  openGraph: {
    title: "JSON to TOML — Convert a Flat or One-level-nested JSON",
    description: "JSON to TOML converts a flat or one-level-nested JSON object into TOML text, entirely in your browser — nothing is uploaded to a server.",
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
