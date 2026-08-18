import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Timestamp Converter — Convert a Unix Timestamp (in Seconds)" },
  description: "Timestamp Converter converts a Unix timestamp (in seconds) to a date and back, entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/timestamp-converter" },
  openGraph: {
    title: "Timestamp Converter — Convert a Unix Timestamp (in Seconds)",
    description: "Timestamp Converter converts a Unix timestamp (in seconds) to a date and back, entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/timestamp-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
