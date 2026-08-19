import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "URL Parser — Break a URL Into Its Components Online Free" },
  description: "URL Parser breaks a URL into its components using the browser's native URL API, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/url-parser" },
  openGraph: {
    title: "URL Parser — Break a URL Into Its Components Online Free",
    description: "URL Parser breaks a URL into its components using the browser's native URL API, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/url-parser",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
