import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JSON Formatter — Parse Your JSON Online Free" },
  description: "JSON Formatter validates and re-indents your JSON in your browser, keeping every number and escape exactly as written.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-formatter" },
  openGraph: {
    title: "JSON Formatter — Parse Your JSON Online Free",
    description: "JSON Formatter validates and re-indents your JSON in your browser, keeping every number and escape exactly as written.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
