import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JPG to WebP Converter — Set Quality or Go Lossless, Free" },
  description: "Turn a JPG photo into WebP with a quality from 1 to 100 or a lossless mode, and compare the KB before and after on the same page.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/jpg-to-webp" },
  openGraph: {
    title: "JPG to WebP Converter — Set Quality or Go Lossless, Free",
    description: "Turn a JPG photo into WebP with a quality from 1 to 100 or a lossless mode, and compare the KB before and after on the same page.",
    url: "https://www.onlineconvertools.com/tools/image-tools/jpg-to-webp",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/jpg-to-webp">{children}</ToolSeo>;
}
