import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Blur Image Online — Gaussian Blur 1 to 20 px, Full Size" },
  description: "Blur a whole photo with a Gaussian blur from 1 to 20 px at full resolution, computed on your graphics chip or processor cores, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-blur" },
  openGraph: {
    title: "Blur Image Online — Gaussian Blur 1 to 20 px, Full Size",
    description: "Blur a whole photo with a Gaussian blur from 1 to 20 px at full resolution, computed on your graphics chip or processor cores, in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-blur",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-blur">{children}</ToolSeo>;
}
