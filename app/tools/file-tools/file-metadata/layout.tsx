import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File Metadata — Instantly Reveals a File's Basic Properties" },
  description: "File Metadata instantly reveals a file's basic properties — name, size, MIME type, date, and extension — read directly in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-metadata" },
  openGraph: {
    title: "File Metadata — Instantly Reveals a File's Basic Properties",
    description: "File Metadata instantly reveals a file's basic properties — name, size, MIME type, date, and extension — read directly in your browser.",
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
