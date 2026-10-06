import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Add Border to Image — Solid Color Frame, 1 to 100 px" },
  description: "Put a plain color frame around a photo or logo, from 1 to 100 px wide. Transparent areas stay clear and a JPG stays a JPG, all in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/add-border-to-image" },
  openGraph: {
    title: "Add Border to Image — Solid Color Frame, 1 to 100 px",
    description: "Put a plain color frame around a photo or logo, from 1 to 100 px wide. Transparent areas stay clear and a JPG stays a JPG, all in your browser.",
    url: "https://www.onlineconvertools.com/tools/image-tools/add-border-to-image",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/add-border-to-image">{children}</ToolSeo>;
}
