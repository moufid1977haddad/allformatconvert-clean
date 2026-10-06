import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "AI Image Upscaler — Enlarge Images 2x or 4x with AI" },
  description: "Enlarge a JPG, PNG or WebP image 2x or 4x with a super-resolution AI model, on your device with WebGPU or on our own server. PNG output.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/image-upscaler" },
  openGraph: {
    title: "AI Image Upscaler — Enlarge Images 2x or 4x with AI",
    description: "Enlarge a JPG, PNG or WebP image 2x or 4x with a super-resolution AI model, on your device with WebGPU or on our own server. PNG output.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/image-upscaler",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/image-upscaler">{children}</ToolSeo>;
}
