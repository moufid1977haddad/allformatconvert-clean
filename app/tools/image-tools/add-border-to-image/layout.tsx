import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Add Border to Image — Let You Add a Solid-color Border" },
  description: "Add Border to Image lets you add a solid-color border of any width around a photo, entirely in your browser using the HTML canvas.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/add-border-to-image" },
  openGraph: {
    title: "Add Border to Image — Let You Add a Solid-color Border",
    description: "Add Border to Image lets you add a solid-color border of any width around a photo, entirely in your browser using the HTML canvas.",
    url: "https://www.onlineconvertools.com/tools/image-tools/add-border-to-image",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
