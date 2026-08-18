import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Tools — Convert, Compress, and Edit Images Online Free" },
  description: "Image Tools is a free online suite of utilities designed to help you edit, convert, and optimize images without downloading any software.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools" },
  openGraph: {
    title: "Image Tools — Convert, Compress, and Edit Images Online Free",
    description: "Image Tools is a free online suite of utilities designed to help you edit, convert, and optimize images without downloading any software.",
    url: "https://www.onlineconvertools.com/tools/image-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
