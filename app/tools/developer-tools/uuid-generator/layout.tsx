import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "UUID Generator — Create Version 4 (random) UUIDs Online Free" },
  description: "UUID Generator creates version 4 (random) UUIDs using the Web Crypto API for cryptographically strong randomness, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/uuid-generator" },
  openGraph: {
    title: "UUID Generator — Create Version 4 (random) UUIDs Online Free",
    description: "UUID Generator creates version 4 (random) UUIDs using the Web Crypto API for cryptographically strong randomness, in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/uuid-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
