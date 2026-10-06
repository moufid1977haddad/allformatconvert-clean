import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Grayscale Converter — Luminance, Channel or Pure B&W" },
  description: "Turn a color photo gray with Rec. 709 luminance or six other methods, or make it pure black and white with a threshold. JPG stays JPG.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/grayscale-converter" },
  openGraph: {
    title: "Grayscale Converter — Luminance, Channel or Pure B&W",
    description: "Turn a color photo gray with Rec. 709 luminance or six other methods, or make it pure black and white with a threshold. JPG stays JPG.",
    url: "https://www.onlineconvertools.com/tools/image-tools/grayscale-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/grayscale-converter">{children}</ToolSeo>;
}
