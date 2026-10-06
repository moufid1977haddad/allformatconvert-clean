import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Unix Timestamp Converter — Seconds, ms, µs, ns to Date" },
  description: "Convert a Unix timestamp given as seconds, milliseconds, microseconds or nanoseconds to UTC and any IANA time zone, or a date and time back to a timestamp.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/timestamp-converter" },
  openGraph: {
    title: "Unix Timestamp Converter — Seconds, ms, µs, ns to Date",
    description: "Convert a Unix timestamp given as seconds, milliseconds, microseconds or nanoseconds to UTC and any IANA time zone, or a date and time back to a timestamp.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/timestamp-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/timestamp-converter">{children}</ToolSeo>;
}
