import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "HTML Encoder — Convert the Five Characters That Matter" },
  description: "HTML Encoder converts the five characters that matter for safe HTML output — &, <, >, quote, and apostrophe — into their HTML entities, entirely in your…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/html-encoder" },
  openGraph: {
    title: "HTML Encoder — Convert the Five Characters That Matter",
    description: "HTML Encoder converts the five characters that matter for safe HTML output — &, <, >, quote, and apostrophe — into their HTML entities, entirely in your…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/html-encoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
