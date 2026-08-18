import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Editor — Be a Free, Full-featured Photo Editor Online" },
  description: "Image Editor is a free, full-featured photo editor that runs entirely in your browser — no upload, no signup, and no software to install.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-editor" },
  openGraph: {
    title: "Image Editor — Be a Free, Full-featured Photo Editor Online",
    description: "Image Editor is a free, full-featured photo editor that runs entirely in your browser — no upload, no signup, and no software to install.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-editor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
