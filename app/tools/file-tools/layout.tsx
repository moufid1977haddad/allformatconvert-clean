import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File Tools — ZIP Compression, File Conversion, Base64 Online" },
  description: "File Tools is a comprehensive free online platform that enables users to convert, compress, and manage various file formats without requiring any software…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools" },
  openGraph: {
    title: "File Tools — ZIP Compression, File Conversion, Base64 Online",
    description: "File Tools is a comprehensive free online platform that enables users to convert, compress, and manage various file formats without requiring any software…",
    url: "https://www.onlineconvertools.com/tools/file-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
