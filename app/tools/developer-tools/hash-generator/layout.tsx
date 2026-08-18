import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Hash Generator — Compute Sha-1, Sha-256 Online Free" },
  description: "Hash Generator computes SHA-1, SHA-256, and SHA-512 hashes of the text you type, using the browser's built-in Web Crypto API — nothing is sent to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/hash-generator" },
  openGraph: {
    title: "Hash Generator — Compute Sha-1, Sha-256 Online Free",
    description: "Hash Generator computes SHA-1, SHA-256, and SHA-512 hashes of the text you type, using the browser's built-in Web Crypto API — nothing is sent to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/hash-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
