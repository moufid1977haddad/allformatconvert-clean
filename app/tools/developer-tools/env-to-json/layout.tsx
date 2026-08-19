import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: ".env to JSON — Parse Key=value Lines Online Free" },
  description: ".env to JSON parses KEY=VALUE lines into a JSON object, and can convert a flat JSON object back into .env lines, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/env-to-json" },
  openGraph: {
    title: ".env to JSON — Parse Key=value Lines Online Free",
    description: ".env to JSON parses KEY=VALUE lines into a JSON object, and can convert a flat JSON object back into .env lines, in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/env-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
