import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Rotate PDF Pages — All Pages or Just the Ones You List" },
  description: "Turn PDF pages 90° clockwise, 180° or 90° counter-clockwise, on every page or only those you list; the angle adds to each page's current turn.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-rotate" },
  openGraph: {
    title: "Rotate PDF Pages — All Pages or Just the Ones You List",
    description: "Turn PDF pages 90° clockwise, 180° or 90° counter-clockwise, on every page or only those you list; the angle adds to each page's current turn.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-rotate",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-rotate">{children}</ToolSeo>;
}
