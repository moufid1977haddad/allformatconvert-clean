import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Hash Generator — MD5, SHA-256, SHA-512, CRC32 for Text & Files, Free" },
  description: "Compute MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3, CRC32 and xxHash for text or files of any size, verify a download against its checksum, add an HMAC key. Nothing is uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/hash-generator" },
  openGraph: {
    title: "Hash Generator — MD5, SHA-256, SHA-512, CRC32 for Text & Files, Free",
    description: "Compute MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3, CRC32 and xxHash for text or files of any size, verify a download against its checksum, add an HMAC key. Nothing is uploaded.",
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
