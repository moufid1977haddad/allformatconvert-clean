import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JSON to Rust Struct — Generate a Single Root Struct" },
  description: "JSON to Rust Struct generates a single Root struct with one field per top-level JSON key, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-rust" },
  openGraph: {
    title: "JSON to Rust Struct — Generate a Single Root Struct",
    description: "JSON to Rust Struct generates a single Root struct with one field per top-level JSON key, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-rust",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
