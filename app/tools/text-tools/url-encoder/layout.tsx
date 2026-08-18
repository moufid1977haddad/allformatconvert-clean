import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "URL Encoder — Convert Special Characters Online Free" },
  description: "URL Encoder converts special characters and spaces into percent-encoded format (and back again), using the browser's built-in…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/url-encoder" },
  openGraph: {
    title: "URL Encoder — Convert Special Characters Online Free",
    description: "URL Encoder converts special characters and spaces into percent-encoded format (and back again), using the browser's built-in…",
    url: "https://www.onlineconvertools.com/tools/text-tools/url-encoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
