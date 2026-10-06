import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Compare Two Images — Before/After Slider and Pixel Diff" },
  description: "Compare two images with a before/after slider, or paint every changed pixel red with the share that differs. Up to 100 MP each, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-comparison" },
  openGraph: {
    title: "Compare Two Images — Before/After Slider and Pixel Diff",
    description: "Compare two images with a before/after slider, or paint every changed pixel red with the share that differs. Up to 100 MP each, in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-comparison",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-comparison">{children}</ToolSeo>;
}
