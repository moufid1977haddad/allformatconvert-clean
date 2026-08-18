import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "TOML to JSON — Parse Simple TOML Online Free" },
  description: "TOML to JSON parses simple TOML — [section] headers and key = value pairs, one level deep — into a JSON object, entirely in your browser — nothing…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/toml-to-json" },
  openGraph: {
    title: "TOML to JSON — Parse Simple TOML Online Free",
    description: "TOML to JSON parses simple TOML — [section] headers and key = value pairs, one level deep — into a JSON object, entirely in your browser — nothing…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/toml-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
