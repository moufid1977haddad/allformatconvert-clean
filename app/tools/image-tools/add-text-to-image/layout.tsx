import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Add Text to Image — Fonts, Outline, Shadow, Rotation" },
  description: "Write one or more lines on a photo: six fonts, color, outline, shadow, opacity and rotation, placed with X and Y sliders, drawn by your own browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/add-text-to-image" },
  openGraph: {
    title: "Add Text to Image — Fonts, Outline, Shadow, Rotation",
    description: "Write one or more lines on a photo: six fonts, color, outline, shadow, opacity and rotation, placed with X and Y sliders, drawn by your own browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/add-text-to-image",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/add-text-to-image">{children}</ToolSeo>;
}
