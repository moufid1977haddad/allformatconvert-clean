import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Editor — Add Text, Images & Annotations Online Free" },
  description: "PDF Editor lets you reorder, rotate, delete, and extract pages, and add text, images, and annotations to any PDF for free, right in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-editor" },
  openGraph: {
    title: "PDF Editor — Add Text, Images & Annotations Online Free",
    description: "PDF Editor lets you reorder, rotate, delete, and extract pages, and add text, images, and annotations to any PDF for free, right in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-editor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
