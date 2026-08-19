import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File Tools — ZIP Compression, File Conversion, Base64 Online" },
  description: "File Tools is a free online platform to convert, compress, and manage various file formats without any software installation.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools" },
  openGraph: {
    title: "File Tools — ZIP Compression, File Conversion, Base64 Online",
    description: "File Tools is a free online platform to convert, compress, and manage various file formats without any software installation.",
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
