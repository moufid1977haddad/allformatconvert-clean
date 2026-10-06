import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Crop Image Online — Exact Pixels or Aspect Ratio Presets" },
  description: "Crop a photo to an exact rectangle in real pixels, or to 1:1, 4:3, 16:9, 9:16 or 4:5 centered. A box on the preview shows what is kept.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-cropper" },
  openGraph: {
    title: "Crop Image Online — Exact Pixels or Aspect Ratio Presets",
    description: "Crop a photo to an exact rectangle in real pixels, or to 1:1, 4:3, 16:9, 9:16 or 4:5 centered. A box on the preview shows what is kept.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-cropper",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-cropper">{children}</ToolSeo>;
}
