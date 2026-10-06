import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Watermark PDF — Text or Logo, Mosaic, Opacity" },
  description: "Stamp a text or PNG/JPG logo watermark on PDF pages: nine positions or a repeated mosaic, rotation, opacity, and over or under the content.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-watermark" },
  openGraph: {
    title: "Watermark PDF — Text or Logo, Mosaic, Opacity",
    description: "Stamp a text or PNG/JPG logo watermark on PDF pages: nine positions or a repeated mosaic, rotation, opacity, and over or under the content.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-watermark",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-watermark">{children}</ToolSeo>;
}
