import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Merge PDF — Combine Multiple PDF Files Online Free" },
  description: "Merge PDF is a free online tool that lets you combine multiple PDF files into a single document instantly.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-merge" },
  openGraph: {
    title: "Merge PDF — Combine Multiple PDF Files Online Free",
    description: "Merge PDF is a free online tool that lets you combine multiple PDF files into a single document instantly.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-merge",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
