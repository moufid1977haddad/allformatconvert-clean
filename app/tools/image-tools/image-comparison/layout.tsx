import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Comparison — Show Two Images Stacked Online Free" },
  description: "Image Comparison shows two images stacked with a draggable vertical divider, letting you slide between a 'before' and 'after' view to spot differences.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-comparison" },
  openGraph: {
    title: "Image Comparison — Show Two Images Stacked Online Free",
    description: "Image Comparison shows two images stacked with a draggable vertical divider, letting you slide between a 'before' and 'after' view to spot differences.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-comparison",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
