import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image Upscaler — Upscale Images Online Free" },
  description: "Image Upscaler is a free online tool that enlarges your images entirely in your browser using the HTML canvas element with high-quality smoothing.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/image-upscaler" },
  openGraph: {
    title: "Image Upscaler — Upscale Images Online Free",
    description: "Image Upscaler is a free online tool that enlarges your images entirely in your browser using the HTML canvas element with high-quality smoothing.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/image-upscaler",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
