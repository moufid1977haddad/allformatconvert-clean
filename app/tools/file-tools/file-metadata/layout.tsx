import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File Metadata — Instantly Reveals a File's Basic Properties" },
  description: "File Metadata is a free online tool that instantly reveals a file's basic properties — name, size, MIME type, last-modified date, and extension — read…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-metadata" },
  openGraph: {
    title: "File Metadata — Instantly Reveals a File's Basic Properties",
    description: "File Metadata is a free online tool that instantly reveals a file's basic properties — name, size, MIME type, last-modified date, and extension — read…",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-metadata",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
