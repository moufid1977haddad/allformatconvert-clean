import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Text Repeater — Duplicate Any Text a Set Number Online Free" },
  description: "Text Repeater duplicates any text a set number of times with your choice of separator, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-repeater" },
  openGraph: {
    title: "Text Repeater — Duplicate Any Text a Set Number Online Free",
    description: "Text Repeater duplicates any text a set number of times with your choice of separator, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-repeater",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
