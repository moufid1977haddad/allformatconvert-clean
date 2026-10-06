import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "HEIC to JPG Converter — Pick the JPEG Quality, Free" },
  description: "Turn an iPhone HEIC or HEIF photo into a JPG with a quality slider. Read by the browser itself, or by heic2any where it cannot. Never uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/heic-to-jpg" },
  openGraph: {
    title: "HEIC to JPG Converter — Pick the JPEG Quality, Free",
    description: "Turn an iPhone HEIC or HEIF photo into a JPG with a quality slider. Read by the browser itself, or by heic2any where it cannot. Never uploaded.",
    url: "https://www.onlineconvertools.com/tools/image-tools/heic-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/heic-to-jpg">{children}</ToolSeo>;
}
