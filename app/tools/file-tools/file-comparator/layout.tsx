import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File Comparator — Compare Files Online Free" },
  description: "File Comparator is a free online tool that instantly checks whether two files are byte-for-byte identical, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-comparator" },
  openGraph: {
    title: "File Comparator — Compare Files Online Free",
    description: "File Comparator is a free online tool that instantly checks whether two files are byte-for-byte identical, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-comparator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
