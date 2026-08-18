import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Add Vignette — Darken the Edges Online Free" },
  description: "Add Vignette darkens the edges of your image with a radial gradient to draw focus toward the center, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/add-vignette" },
  openGraph: {
    title: "Add Vignette — Darken the Edges Online Free",
    description: "Add Vignette darkens the edges of your image with a radial gradient to draw focus toward the center, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/add-vignette",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
