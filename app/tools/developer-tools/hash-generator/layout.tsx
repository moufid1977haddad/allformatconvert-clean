import type { Metadata } from 'next';
import { SEO } from './seo';
import ToolSeo from '@/app/components/ToolSeo';

// P36: title and description written here as plain strings (the content checks read them); seo.js repeats them.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: "Hash Generator — MD5, SHA-256, SHA-512 & CRC32 Checksums" },
  description: "Hash text or files with MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3, CRC32 or xxHash, add an HMAC key or check a published checksum. Nothing is uploaded.",
  alternates: { canonical: url },
  openGraph: { title: "Hash Generator — MD5, SHA-256, SHA-512 & CRC32 Checksums", description: "Hash text or files with MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3, CRC32 or xxHash, add an HMAC key or check a published checksum. Nothing is uploaded.", url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it. Its structured data is
// rendered by SeoContent from the page's visible texts since P35 (ToolSeo: related tools + JSON-LD).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSeo path="/tools/developer-tools/hash-generator">{children}</ToolSeo>
    </>
  );
}
